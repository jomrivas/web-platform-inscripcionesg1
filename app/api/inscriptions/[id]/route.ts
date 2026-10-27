// app/api/inscriptions/[id]/route.ts
// PATCH — aceptar/rechazar inscripción (solo admin)
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { adultoSchema, beneficiarioSchema } from '@/lib/validators';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const cookieToken =
    request.cookies.get('sb-access-token')?.value ||
    request.cookies.get('sb-localhost-auth-token')?.value;
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const token = bearer || cookieToken;
  if (!token) return null;

  const userClient = createClient(supabaseUrl, anonKey);
  const {
    data: { user },
  } = await userClient.auth.getUser(token);
  if (!user) return null;

  const adminDb = createClient(supabaseUrl, serviceKey);
  const { data: roleData } = await adminDb
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();
  if (!roleData || roleData.role !== 'admin') return null;
  return user;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminUser = await requireAdmin(request);
  if (!adminUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
  }

  const body = await request.json();
  const { status, rejection_reason } = body;

  // Estados: draft (borrador), submitted (pendiente), approved (aprobado), rejected
  if (!['draft', 'submitted', 'approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
  }
  if (status === 'rejected' && !rejection_reason?.trim()) {
    return NextResponse.json(
      { error: 'El motivo de rechazo es requerido' },
      { status: 400 }
    );
  }

  const adminDb = createClient(supabaseUrl, serviceKey);
  const { data, error } = await adminDb
    .from('inscriptions')
    .update({
      status,
      rejection_reason: status === 'rejected' ? rejection_reason.trim() : null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: 'Error al actualizar: ' + error.message },
      { status: 500 }
    );
  }

  await adminDb.from('audit_log').insert([
    {
      inscription_id: id,
      admin_id: adminUser.id,
      action: `status -> ${status}`,
      new_values: { status, rejection_reason: data.rejection_reason },
    },
  ]);

  return NextResponse.json({ success: true, inscription: data });
}

// GET — leer una inscripción con su ficha (dueño o admin)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    supabaseUrl,
    anonKey,
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
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;
  const adminDb = createClient(supabaseUrl, serviceKey);

  const { data: inscription, error } = await adminDb
    .from('inscriptions')
    .select('id, user_id, type, inscription_year, status, rejection_reason, submitted_at, created_at')
    .eq('id', id)
    .single();
  if (error || !inscription) {
    return NextResponse.json(
      { error: 'Inscripción no encontrada' },
      { status: 404 }
    );
  }

  const { data: roleData } = await adminDb
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();
  const isAdmin = roleData?.role === 'admin';
  const isOwner =
    (inscription as { user_id: string }).user_id === user.id;
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const table =
    (inscription as { type: string }).type === 'adulto'
      ? 'adult_forms'
      : 'beneficiary_forms';
  const { data: form } = await adminDb
    .from(table)
    .select('*')
    .eq(
      'inscription_id',
      (inscription as { id: string }).id
    )
    .single();

  return NextResponse.json({ inscription, form: form ?? null });
}

// PUT — edición completa por admin (actualiza solo campos conocidos;
// columnas fuera del formulario se conservan)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminUser = await requireAdmin(request);
  if (!adminUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;
  const adminDb = createClient(supabaseUrl, serviceKey);

  const { data: inscription, error: inscError } = await adminDb
    .from('inscriptions')
    .select('id, type')
    .eq('id', id)
    .single();
  if (inscError || !inscription) {
    return NextResponse.json(
      { error: 'Inscripción no encontrada' },
      { status: 404 }
    );
  }

  const body = await request.json();
  const { formData } = body as { formData?: unknown };
  if (!formData || typeof formData !== 'object') {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
  }

  const type = (inscription as { type: string }).type;
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

  const table = type === 'adulto' ? 'adult_forms' : 'beneficiary_forms';
  const { error: updError } = await adminDb
    .from(table)
    .update(parsed.data)
    .eq(
      'inscription_id',
      (inscription as { id: string }).id
    );
  if (updError) {
    return NextResponse.json(
      { error: 'Error al actualizar: ' + updError.message },
      { status: 500 }
    );
  }

  await adminDb.from('audit_log').insert([
    {
      inscription_id: (inscription as { id: string }).id,
      admin_id: adminUser.id,
      action: 'edit',
      new_values: parsed.data,
    },
  ]);

  return NextResponse.json({ success: true });
}
