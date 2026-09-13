import { supabase } from '../../../../lib/supabase';
import { teamOut, teamIn } from '../../../../lib/map';

export async function PUT(req, { params }) {
  const body = await req.json();
  const { data, error } = await supabase.from('teams').update(teamIn(body)).eq('id', params.id).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(teamOut(data));
}

export async function DELETE(req, { params }) {
  const { error } = await supabase.from('teams').delete().eq('id', params.id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
