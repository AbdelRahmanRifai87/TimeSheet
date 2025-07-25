@extends('layouts.app')

@section('content')
    <div class="max-w-md mx-auto mt-12 p-6 bg-white rounded shadow">
        <h2 class="text-2xl font-bold mb-6">Login</h2>
        <div id="laravel-errors" style="display:none;">
            @if ($errors->any())
                <ul>
                    @foreach ($errors->all() as $error)
                        <li class="error-message">{{ $error }}</li>
                    @endforeach
                </ul>
            @endif
        </div>
        @if (session('status'))
            <div id="laravel-success" style="display:none;">
                <span class="success-message">{{ session('status') }}</span>
            </div>
        @endif
        <form method="POST" action="{{ route('login') }}" id="loginForm">
            @csrf
            <div class="mb-4">
                <label class="block mb-1 font-semibold">Email</label>
                <input type="email" name="email" class="border rounded px-3 py-2 w-full" value="{{ old('email') }}" required
                    autofocus>
            </div>
            <div class="mb-6">
                <label class="block mb-1 font-semibold">Password</label>
                <input type="password" name="password" class="border rounded px-3 py-2 w-full" required>
            </div>
            <button type="submit" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded w-full">Login</button>
        </form>
    </div>
    @vite('resources/js/login.js')


@endsection