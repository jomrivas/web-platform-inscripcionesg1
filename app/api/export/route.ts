// app/api/export/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;
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

type FlatRow = Record<string, unknown>;

function convertToCSV(data: FlatRow[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');

  const csvRows = data.map((row) =>
    headers
      .map((header) => {
        const value = row[header] as unknown;
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') {
          return `"${value.replace(/"/g, '""')}"`;
        }
        if (typeof value === 'object') {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        return String(value);
      })
      .join(',')
  );

  return [csvHeaders, ...csvRows].join('\n');
}

async function generateExcelXLSX(data: FlatRow[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Grupo Scout No. 1 "Los Intrépidos"';
  const sheet = workbook.addWorksheet('Inscripciones');
  if (data.length === 0) {
    sheet.addRow(['Sin registros']);
  } else {
    sheet.columns = Object.keys(data[0]).map((key) => ({
      header: key,
      key,
      width: 22,
    }));
    sheet.getRow(1).font = { bold: true };
    for (const row of data) {
      const flat: FlatRow = {};
      for (const [k, v] of Object.entries(row)) {
        flat[k] = typeof v === 'object' && v !== null ? JSON.stringify(v) : v;
      }
      sheet.addRow(flat);
    }
  }
  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.from(buf);
}

async function generatePDF(data: FlatRow[], title: string): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page = doc.addPage([595, 842]);
  let y = 800;
  const draw = (text: string, opts?: { bold?: boolean; size?: number }) => {
    if (y < 60) {
      page = doc.addPage([595, 842]);
      y = 800;
    }
    page.drawText(text.slice(0, 110), {
      x: 40,
      y,
      size: opts?.size ?? 9,
      font: opts?.bold ? fontBold : font,
      color: rgb(0, 0, 0),
    });
    y -= 14;
  };
  draw(title, { bold: true, size: 14 });
  draw(`Generado: ${new Date().toLocaleString('es-SV')}`);
  draw(`Total registros: ${data.length}`);
  y -= 8;
  data.slice(0, 500).forEach((row, idx) => {
    draw(
      `${idx + 1}. ${String(row.nombre ?? '-')} | ${String(row.identificacion ?? '-')} | ${String(row.email_contacto ?? '-')} | ${String(row.rama ?? '-')} | ${String(row.inscription_year ?? '')} | ${String(row.type ?? '')} | ${String(row.status ?? '')}`
    );
  });
  const bytes = await doc.save();
  return Buffer.from(bytes);
}

function generateSQLBackup(
  tables: { name: string; rows: FlatRow[] }[]
): string {
  const lines = [
    `-- Backup Grupo Scout No. 1 "Los Intrépidos"`,
    `-- Generado: ${new Date().toISOString()}`,
    '',
  ];

  for (const { name, rows } of tables) {
    lines.push(`-- Tabla: ${name} (${rows.length} registros)`);
    for (const row of rows) {
      const columns = Object.keys(row);
      if (columns.length === 0) continue;
      const values = columns
        .map((col) => {
          const val = row[col] as unknown;
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
          if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
          if (typeof val === 'object')
            return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
          return String(val);
        })
        .join(', ');
      lines.push(`INSERT INTO ${name} (${columns.join(', ')}) VALUES (${values});`);
    }
    lines.push('');
  }

  lines.push('-- Fin del backup');
  return lines.join('\n');
}

export async function GET(request: NextRequest) {
  try {
    const adminUser = await requireAdmin(request);
    if (!adminUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const adminDb = createClient(supabaseUrl, serviceKey);
    const params = request.nextUrl.searchParams;
    const format = params.get('format') || 'csv';
    const type = params.get('type');
    const year = params.get('year') || new Date().getFullYear().toString();
    const status = params.get('status');

    let query = adminDb
      .from('inscriptions')
      .select(
        'id, type, inscription_year, status, created_at, adult_forms (*), beneficiary_forms (*)'
      )
      .order('created_at', { ascending: false });
    if (year && year !== 'all')
      query = query.eq('inscription_year', parseInt(year));
    if (type && type !== 'all') query = query.eq('type', type);
    if (status && status !== 'all') query = query.eq('status', status);

    const { data, error } = (await query) as unknown as {
      data: Array<Record<string, unknown>> | null;
      error: { message: string } | null;
    };

    if (error) {
      return NextResponse.json(
        { error: 'Error al obtener datos: ' + error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'No hay registros para exportar' },
        { status: 404 }
      );
    }

    const flat: FlatRow[] = data.map((r) => {
      const adult = (
        Array.isArray(r.adult_forms) ? r.adult_forms[0] : r.adult_forms
      ) as FlatRow | null;
      const ben = (
        Array.isArray(r.beneficiary_forms)
          ? r.beneficiary_forms[0]
          : r.beneficiary_forms
      ) as FlatRow | null;
      const form: FlatRow = { ...(adult || ben || {}) };
      // Las firmas (base64) no van en tabulares; sí quedan en el backup SQL
      for (const k of Object.keys(form)) {
        if (k.startsWith('firma_')) delete form[k];
      }
      delete form.id;
      delete form.inscription_id;
      delete form.created_at;
      return {
        id: r.id,
        type: r.type,
        inscription_year: r.inscription_year,
        status: r.status,
        nombre: form.nombre_completo ?? '-',
        identificacion: form.dui ?? form.dui_numero ?? '-',
        email_contacto:
          form.email ?? form.madre_email ?? form.padre_email ?? '-',
        rama: form.rama ?? form.rama_inscripcion ?? '',
        ...form,
      };
    });

    const timestamp = new Date().toISOString().split('T')[0];

    switch (format) {
      case 'excel': {
        const buf = await generateExcelXLSX(flat);
        return new NextResponse(new Uint8Array(buf), {
          status: 200,
          headers: {
            'Content-Type':
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="gs1-inscripciones-${year}-${timestamp}.xlsx"`,
          },
        });
      }

      case 'pdf': {
        const buf = await generatePDF(
          flat,
          `Inscripciones Grupo Scout No. 1 - Año ${year}`
        );
        return new NextResponse(new Uint8Array(buf), {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="gs1-inscripciones-${year}-${timestamp}.pdf"`,
          },
        });
      }

      case 'sql': {
        const ids = data.map((r) => r.id as string);
        const [{ data: insc }, { data: adults }, { data: benefs }] =
          await Promise.all([
            adminDb.from('inscriptions').select('*').in('id', ids),
            adminDb.from('adult_forms').select('*').in('inscription_id', ids),
            adminDb
              .from('beneficiary_forms')
              .select('*')
              .in('inscription_id', ids),
          ]);
        const content = generateSQLBackup([
          { name: 'inscriptions', rows: (insc as FlatRow[]) ?? [] },
          { name: 'adult_forms', rows: (adults as FlatRow[]) ?? [] },
          { name: 'beneficiary_forms', rows: (benefs as FlatRow[]) ?? [] },
        ]);
        return new NextResponse(content, {
          status: 200,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Content-Disposition': `attachment; filename="gs1-backup-${year}-${timestamp}.sql"`,
          },
        });
      }

      case 'csv':
      default: {
        const content = convertToCSV(flat);
        return new NextResponse(content, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="gs1-inscripciones-${year}-${timestamp}.csv"`,
          },
        });
      }
    }
  } catch (error) {
    console.error('Error en GET /api/export:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
