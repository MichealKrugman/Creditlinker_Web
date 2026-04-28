/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@supabase/supabase-js",
    "@supabase/auth-js",
    "@supabase/realtime-js",
    "@supabase/postgrest-js",
    "@supabase/storage-js",
    "@supabase/functions-js",
  ],
};

module.exports = nextConfig;
