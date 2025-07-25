<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cookie;

class StaticJwtMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->cookie('jwt_token');
        Log::info('Checking for JWT in request', ['token' => $token]);
        if (!$token) {

            Log::info('No JWT found in Authorization header, checking cookie');
            // Try to get JWT from cookie if not in Authorization header
            $token = $request->cookie('jwt_token');
        }
        if (!$token) {
            Log::info('No JWT found in request');

            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $jwtSecret = env('JWT_SECRET');

        // Check JWT format before decoding
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            Log::warning('JWT token has wrong number of segments', ['token' => $token]);
            return response()->json(['message' => 'Token parsing error: Wrong number of segments'], 401);
        }

        try {
            // Decode and verify the JWT
            $payload = JWT::decode($token, new Key($jwtSecret, 'HS256'));
            $payloadArr = (array) $payload;



            // Check for required claims
            if (empty($payloadArr['sub'])) {
                return response()->json(['message' => 'Invalid token: missing subject'], 401);
            }

            // Check for expiration
            if (empty($payloadArr['exp']) || $payloadArr['exp'] < time()) {
                return response()->json(['message' => 'Token expired'], 401);
            }

            // Add user info to request for controllers to use
            $request->attributes->set('jwt_user', $payloadArr);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Token parsing error: ' . $e->getMessage()], 401);
        }

        return $next($request);
    }
}
