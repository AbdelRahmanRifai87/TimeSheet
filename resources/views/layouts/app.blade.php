{{-- filepath: resources/views/layouts/app.blade.php --}}
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>TimeSheet App</title>

    @vite('resources/css/app.css')
    <script src="https://cdn.tailwindcss.com"></script>
    {{--
    <link href="{{ asset('css/app.css') }}" rel="stylesheet"> --}}
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/choices.js/public/assets/styles/choices.min.css" />
    <script src="https://cdn.jsdelivr.net/npm/choices.js/public/assets/scripts/choices.min.js"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
    <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
    <!-- DataTables CSS -->
    <link rel="stylesheet" href="https://cdn.datatables.net/1.13.7/css/jquery.dataTables.min.css">
    <!-- jQuery -->
    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
    <!-- DataTables JS -->
    <script src="https://cdn.datatables.net/1.13.7/js/jquery.dataTables.min.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">


</head>

<body class="bg-white-100 text-gray-800 text-sm">
    <div id="toastContainer" class="fixed top-4 right-4 z-50 space-y-2 z-[100]"></div>

    <nav class="bg-[#438eb9] border-b border-gray-200 shadow-sm mb-4 sticky top-0 z-40">
        <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <a class="text-xl font-bold text-gray-800" href="#">TimeSheet</a>
        </div>
        {{-- Progress Bar
        @php
            $currentStep = $currentStep ?? 1;
            $steps = [
                1 => 'Data Entry',
                2 => 'Home',
                3 => 'Details',
                4 => 'Review',
            ];
        @endphp
        <div class="w-full bg-white border-t border-b border-gray-200 py-2">
            <div class="max-w-4xl mx-auto flex justify-between text-sm text-gray-600 px-4">
                @foreach ($steps as $step => $label)
                    {{-- Circle --}}
        {{--        <div class="flex-1 text-center">
                        <div
                            class="  @if ($currentStep == $step) text-[#75B3D7] font-bold underline @elseif($currentStep > $step) text-[#87b87f] font-medium @else text-gray-400 @endif">
                            {{ $step }}. {{ $label }}
                        </div>
                        <div
                            class="
                            rounded-full w-10 h-10 flex items-center justify-center
                            text-white font-bold
                            transition-all duration-500
                            @if ($currentStep == $step) bg-blue-600 border-4 border-blue-300 scale-110 shadow-lg
                            @elseif($currentStep > $step)
                                bg-green-500 border-4 border-green-300
                            @else
                                bg-gray-300 border-4 border-gray-200 @endif
                        ">
                            @if ($currentStep > $step)
                                <i class="fas fa-check transition-opacity duration-500 opacity-100"></i>
                            @else
                                {{ $step }}
                            @endif
                        </div>
                        <span
                            class="mt-2 text-xs font-medium text-gray-700 transition-all duration-500">{{ $label }}</span> 
                    </div>
                    {{-- Line (except after last circle) --}}
        {{--  @if ($step < count($steps))
                        <div
                            class="flex-1 h-1 mx-2 rounded transition-all duration-500
                                    @if ($currentStep > $step) bg-green-500
                                    @elseif($currentStep == $step)
                                        bg-blue-300
                                    @else
                                        bg-gray-200 @endif
                                ">
                        </div>
                    @endif
                @endforeach
            </div>
        </div> --}}
        <div id="userInfo" class="text-center w-[41.5%] ml-8 text-white text-sm px-4 py-2">
            {{-- Display user information --}}

        </div>
    </nav>

    <main>
        @yield('content')
    </main>
    <script>
        // Function to get the value of a specific cookie
        function getCookie(name) {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop().split(";").shift();
        }

        // Get the token from the cookie
        const token = getCookie("jwt_token");
        if (token) {
            try {
                // Split the token into parts (header, payload, signature)
                const parts = token.split(".");
                if (parts.length !== 3) {
                    throw new Error("Invalid JWT format");
                }

                // Decode the payload (base64-decoded)
                const payload = JSON.parse(atob(parts[1])); // Decode base64 payload
                console.log("Decoded JWT Payload:", payload);

                // Extract the username or default to 'Guest'
                const username = payload.email || "Guest"; // Adjust field based on your payload structure

                // Display the username in the userInfo div
                document.getElementById("userInfo").textContent = `Welcome, ${username}`;
            } catch (error) {
                console.error("Failed to decode token:", error);
                document.getElementById("userInfo").textContent = "Welcome, Guest";
            }
        } else {
            document.getElementById("userInfo").textContent = "Welcome, Guest";
        }
    </script>
</body>

</html>
