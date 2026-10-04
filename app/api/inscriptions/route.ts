// app/api/inscriptions/route.ts
import { createServerClient } from '@supabase/ssr';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { adultoSchema, beneficiarioSchema } from '@/lib/validators';

async function getSessionUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

const adminDb = () =>
  createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function POST(request: NextRequest) {
  try {
    // 0. Sesión requerida: no se confía en userId del cliente
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { type, formData } = body;
    const userId = sessionUser.id;

    if (!type || !formData) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    if (!['adulto', 'beneficiario'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipo de inscripción inválido' },
        { status: 400 }
      );
    }

    // 0b. Validación server-side con Zod (firma obligatoria incluida)
    const parsed =
      type === 'adulto'
        ? adultoSchema.safeParse(formData)
        : beneficiarioSchema.safeParse(formData);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const supabase = adminDb();

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
    const table = type === 'adulto' ? 'adult_forms' : 'beneficiary_forms';

    const { error: formError } = await supabase.from(table).insert([
      {
        inscription_id: inscriptionId,
        ...parsed.data,
      },
    ]);

    if (formError) {
      // Rollback: eliminar inscripción huérfana
      await supabase.from('inscriptions').delete().eq('id', inscriptionId);
      return NextResponse.json(
        { error: `Error al guardar formulario ${type}` },
        { status: 500 }
      );
    }

    // 3. Obtener email del usuario (autenticado)
    const {
      data: { user },
    } = await supabase.auth.admin.getUserById(userId);

    // 4. Email de confirmación no bloqueante
    const tipoNombre = type === 'adulto' ? 'Adulto Voluntario' : 'Beneficiario';
    const nombrePersona =
      (parsed.data as { nombre_completo?: string }).nombre_completo || '';
    const fromEmail =
      process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    if (user?.email && process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: fromEmail,
          to: user.email,
          subject: `Inscripción Registrada - Grupo Scout No. 1 ${inscriptionYear}`,
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2>¡Bienvenida/o, ${nombrePersona}!</h2>
              <p>Tu inscripción ha sido registrada exitosamente en el Grupo Scout No. 1 "Los Intrépidos".</p>
              <div style="background: #f0f7ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Tipo de Inscripción:</strong> ${tipoNombre}</p>
                <p><strong>Año de Inscripción:</strong> ${inscriptionYear}</p>
                <p><strong>ID de Inscripción:</strong> ${inscriptionId}</p>
                <p><strong>Estado:</strong> Enviado para revisión</p>
              </div>
              <p>Un administrador del grupo revisará tu solicitud en breve.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
              <p style="font-size: 12px; color: #666; text-align: center;">
                Grupo Scout No. 1 "Los Intrépidos"<br>
                San Salvador, El Salvador
              </p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error('Resend falló (no bloqueante):', emailError);
      }
    }

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
