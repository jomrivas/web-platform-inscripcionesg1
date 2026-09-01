// app/api/inscriptions/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, formData, userId } = body;

    // Validar inputs
    if (!type || !formData || !userId) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    if (!['adulto', 'beneficiario'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipo de inscripción inválido' },
        { status: 400 }
      );
    }

    // 1. Crear inscripción
    const inscriptionYear = new Date().getFullYear();
    const { data: inscriptionData, error: inscriptionError } = await supabase
      .from('inscriptions')
      .insert([
        {
          user_id: userId,
          type,
          inscription_year: inscriptionYear,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (inscriptionError || !inscriptionData) {
      return NextResponse.json(
        { error: 'Error al crear inscripción: ' + inscriptionError?.message },
        { status: 500 }
      );
    }

    // 2. Crear formulario específico según tipo
    const inscriptionId = inscriptionData.id;

    if (type === 'adulto') {
      const { error: formError } = await supabase
        .from('adult_forms')
        .insert([
          {
            inscription_id: inscriptionId,
            ...formData,
          },
        ]);

      if (formError) {
        // Rollback: eliminar inscripción
        await supabase.from('inscriptions').delete().eq('id', inscriptionId);
        return NextResponse.json(
          { error: 'Error al guardar formulario adulto' },
          { status: 500 }
        );
      }
    } else if (type === 'beneficiario') {
      const { error: formError } = await supabase
        .from('beneficiary_forms')
        .insert([
          {
            inscription_id: inscriptionId,
            ...formData,
          },
        ]);

      if (formError) {
        // Rollback: eliminar inscripción
        await supabase.from('inscriptions').delete().eq('id', inscriptionId);
        return NextResponse.json(
          { error: 'Error al guardar formulario beneficiario' },
          { status: 500 }
        );
      }
    }

    // 3. Obtener email del usuario
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.admin.getUserById(userId);

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Error al obtener usuario' },
        { status: 500 }
      );
    }

    // 4. Enviar email de confirmación
    const tipoNombre = type === 'adulto' ? 'Adulto Voluntario' : 'Beneficiario';
    const nombrePersona =
      type === 'adulto'
        ? formData.nombre_completo
        : formData.nombre_completo;

    await resend.emails.send({
      from: 'onboarding@resend.dev', // Ajustar al dominio verificado en Resend
      to: user.email!,
      subject: `✅ Inscripción Registrada - Grupo Scout No. 1 ${inscriptionYear}`,
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2>¡Bienvenida/o, ${nombrePersona}!</h2>
              
              <p>Tu inscripción ha sido registrada exitosamente en el Grupo Scout No. 1 "Los Intrépidos".</p>
              
              <div style="background: #f0f7ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Tipo de Inscripción:</strong> ${tipoNombre}</p>
                <p><strong>Año de Inscripción:</strong> ${inscriptionYear}</p>
                <p><strong>ID de Inscripción:</strong> ${inscriptionId}</p>
                <p><strong>Estado:</strong> Enviado para revisión</p>
              </div>
              
              <p>Un administrador del grupo revisará tu solicitud en breve.</p>
              
              <p>Si tienes dudas, puedes contactar a:</p>
              <p>
                📧 <strong>Email:</strong> gruposcout1.losintrepidos@gmail.com<br>
                📱 <strong>WhatsApp:</strong> +503 XXXX-XXXX
              </p>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
              
              <p style="font-size: 12px; color: #666; text-align: center;">
                Grupo Scout No. 1 "Los Intrépidos"<br>
                Escuela Americana, San Salvador, El Salvador<br>
                <!--a href="https://www.scouts.org" style="color: #0066cc;">Movimiento Scout</a-->
              </p>
            </div>
          </body>
        </html>
      `,
    });

    return NextResponse.json(
      {
        success: true,
        inscriptionId,
        message: 'Inscripción creada y email enviado',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error en POST /api/inscriptions:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
