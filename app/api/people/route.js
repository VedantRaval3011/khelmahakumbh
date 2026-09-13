import { supabase } from '../../../lib/supabase';
import { personOut, personIn } from '../../../lib/map';

export async function GET() {
  const { data, error } = await supabase.from('people').select('*').order('name');
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data.map(personOut));
}

export async function POST(req) {
  const body = await req.json();
  if (!body.name || !body.name.trim()) {
    return Response.json({ error: 'Name is required.' }, { status: 400 });
  }
  const { data, error } = await supabase.from('people').insert(personIn(body)).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(personOut(data), { status: 201 });
}
