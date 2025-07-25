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

<body>
    <div id="toastContainer" class="fixed top-4 right-4 z-50 space-y-2"></div>

    <nav class="bg-blue-100 mb-4 sticky top-0 z-40 shadow">
        <div class="max-w-7xl mx-auto px-4 py-3 flex items-center">
            <a class="text-xl font-bold text-gray-800" href="#">TimeSheet</a>
        </div>
        {{-- Progress Bar --}}
        @php
            $currentStep = $currentStep ?? 1;
            $steps = [
                1 => 'Data Entry',
                2 => 'Home',
                3 => 'Details',
                4 => 'Review',
            ];
        @endphp
        <div class="w-full flex justify-center pb-2">
            <div class="flex items-center max-w-2xl w-full">
                @foreach($steps as $step => $label)
                    {{-- Circle --}}
                    <div class="relative flex flex-col items-center">
                        <div class="
                            rounded-full w-10 h-10 flex items-center justify-center
                            text-white font-bold
                            transition-all duration-500
                            @if($currentStep == $step)
                                bg-blue-600 border-4 border-blue-300 scale-110 shadow-lg
                            @elseif($currentStep > $step)
                                bg-green-500 border-4 border-green-300
                            @else
                                bg-gray-300 border-4 border-gray-200
                            @endif
                        ">
                            @if($currentStep > $step)
                                <i class="fas fa-check transition-opacity duration-500 opacity-100"></i>
                            @else
                                {{ $step }}
                            @endif
                        </div>
                        <span class="mt-2 text-xs font-medium text-gray-700 transition-all duration-500">{{ $label }}</span>
                    </div>
                    {{-- Line (except after last circle) --}}
                    @if($step < count($steps))
                        <div class="flex-1 h-1 mx-2 rounded transition-all duration-500
                                    @if($currentStep > $step)
                                        bg-green-500
                                    @elseif($currentStep == $step)
                                        bg-blue-300
                                    @else
                                        bg-gray-200
                                    @endif
                                "></div>
                    @endif
                @endforeach
            </div>
        </div>
    </nav>

    <main>
        @yield('content')
    </main>
    <script>

    </script>
</body>

</html>