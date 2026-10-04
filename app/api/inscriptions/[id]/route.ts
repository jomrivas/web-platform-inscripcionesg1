// app/api/inscriptions/[id]/route.ts
// PATCH — aceptar/rechazar inscripción (solo admin)
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

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

  // Estados finales por ahora: submitted (aceptado/pendiente) y rejected
  if (!['submitted', 'rejected', 'draft'].includes(status)) {
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
