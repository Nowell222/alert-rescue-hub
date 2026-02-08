import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TEST_USERS = [
  { email: 'resident@test.com', password: 'password123', fullName: 'Juan Dela Cruz', role: 'resident' },
  { email: 'rescuer@test.com', password: 'password123', fullName: 'Pedro Rescuer', role: 'rescuer' },
  { email: 'admin@test.com', password: 'password123', fullName: 'Maria Admin', role: 'mdrrmo_admin' },
  { email: 'official@test.com', password: 'password123', fullName: 'Jose Official', role: 'barangay_official' },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const results = [];

    for (const testUser of TEST_USERS) {
      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === testUser.email);

      if (existingUser) {
        // Update the role if user exists
        await supabaseAdmin
          .from('user_roles')
          .upsert({ 
            user_id: existingUser.id, 
            role: testUser.role 
          }, { 
            onConflict: 'user_id,role' 
          });

        results.push({ email: testUser.email, status: 'already exists', role: testUser.role });
        continue;
      }

      // Create new user
      const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: testUser.email,
        password: testUser.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: { full_name: testUser.fullName }
      });

      if (createError) {
        results.push({ email: testUser.email, status: 'error', error: createError.message });
        continue;
      }

      if (userData.user) {
        // Update the role (trigger creates 'resident' by default)
        if (testUser.role !== 'resident') {
          await supabaseAdmin
            .from('user_roles')
            .update({ role: testUser.role })
            .eq('user_id', userData.user.id);
        }

        // Update profile with full name
        await supabaseAdmin
          .from('profiles')
          .update({ full_name: testUser.fullName })
          .eq('user_id', userData.user.id);

        results.push({ email: testUser.email, status: 'created', role: testUser.role });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Seed error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
