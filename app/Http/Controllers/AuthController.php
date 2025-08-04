<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    public function showLoginForm()
    {
        return view('auth.login');
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);
        Log::info('Login attempt', ['email' => $request->email]);

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return back()->withErrors(['email' => 'No account found with this email address.'])->withInput();
        }
        if (!Hash::check($request->password, (string)$user->password)) {
            return back()->withErrors(['password' => 'Incorrect password.'])->withInput();
        }

        Log::info('User authenticated', ['user_id' => $user->id]);
        // Generate JWT
        $payload = [
            'sub' => $user->id,
            'email' => $user->email,
            'iat' => time(),
            'exp' => time() + 60 * 60 * 24, // 1 day expiry
        ];
        Log::info('JWT payload', $payload);
        $jwt = JWT::encode($payload, env('JWT_SECRET', 'changeme'), 'HS256');
        Log::info('JWT generated', ['jwt' => $jwt]);
        // Set JWT as HttpOnly, Secure cookie and redirect
        return redirect('/dataentry')
            ->withCookie(
                cookie(
                    'jwt_token',
                    $jwt,
                    60 * 24, // 1 day in minutes
                    null,
                    null,
                    false,    // Secure
                    false,    // HttpOnly
                    false,
                    "Lax"
                )
            );
    }
}
