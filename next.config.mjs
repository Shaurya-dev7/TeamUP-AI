/** @type {import('next').NextConfig} */

console.log('--------------------------------------------------');
console.log('🔍 Checking Environment Variables during Build:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Found' : '❌ MISSING');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Found' : '❌ MISSING');
console.log('--------------------------------------------------');


const nextConfig = {
	turbopack: {},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "**",
			},
		],
	},
	typescript: {
		ignoreBuildErrors: true,
	},
	eslint: {
		ignoreDuringBuilds: true,
	},
	allowedDevOrigins: ["*.theopenbuilder.com"],
};

export default nextConfig;
