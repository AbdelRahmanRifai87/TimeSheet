{{-- filepath: resources/views/layouts/app.blade.php --}}
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">

    <meta name="csrf-token" content="{{ csrf_token() }}">

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

    <!-- Profile Modal Styles -->
    <style>
        .profile-tab.active {
            border-bottom: 2px solid #2563eb;
            color: #2563eb;
            background: #f8fafc;
        }

        .profile-tab-content input[readonly],
        .profile-tab-content select[disabled] {
            background: #f8f9fa;
            color: #6c757d;
        }

        .profile-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.4);
            z-index: 9999;
            align-items: center;
            justify-content: center;
        }

        .profile-modal-content {
            background: #fff;
            border-radius: 10px;
            width: 90vw;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 2px 16px rgba(0, 0, 0, 0.2);
        }
    </style>

    <!-- using the mobi scroll for the scrollable timepicker -->
    <!-- Mobiscroll CDN-->
    <!-- <link rel="stylesheet" href="https://cdn.mobiscroll.com/5.29.0/css/mobiscroll.min.css" />
    <script src="https://cdn.mobiscroll.com/5.29.0/js/mobiscroll.min.js"></script>  -->

</head>

<body>
    <div id="toastContainer" class="fixed top-4 right-4 z-50 space-y-2"></div>

    <!-- Blue Header with Bigger Logos -->
    <div class="bg-[#438eb9] text-white w-full">
        <div class="flex justify-between items-center px-6 py-1">
            <!-- SECURE-X Logo -->
            <div class="flex items-center">
                <img src="{{ asset('images/securex.png') }}" alt="SECURE-X" class="h-20 object-contain">
            </div>

            <!-- Securecy Logo -->
            <div class="flex items-center">
                <img src="{{ asset('images/sec250.png') }}" alt="Securecy" class="h-20 object-contain">
            </div>
        </div>
    </div>


    <!-- Separator Line -->
    <div class="h-px bg-gray-300"></div>

    <div class="flex">
        <!-- Left Navigation Sidebar -->
        @if (Route::currentRouteName() !== 'login')
            <div class="w-64 bg-gray-100 min-h-screen border-r border-gray-200">
                <!-- Navigation Items -->
                <nav class="p-4">
                    <ul class="space-y-1">
                        <!-- Dashboard -->
                        <li>
                            <a href="#"
                                class="flex items-center justify-between p-3 text-gray-700 hover:bg-gray-200 rounded transition-colors">
                                <div class="flex items-center">
                                    <i class="fas fa-tachometer-alt mr-3"></i>
                                    <span>Dashboard</span>
                                </div>
                                <i class="fas fa-chevron-down text-xs"></i>
                            </a>
                        </li>

                        <hr class="border-gray-300 my-2">

                        <!-- Your Details -->
                        <!-- <li>
                            <a href="#" class="flex items-center justify-between p-3 text-gray-700 hover:bg-gray-200 rounded transition-colors">
                                <div class="flex items-center">
                                    <i class="fas fa-user mr-3"></i>
                                    <span>Your Details</span>
                                </div>
                                <i class="fas fa-chevron-down text-xs"></i>
                            </a>
                        </li> -->

                        <!-- <hr class="border-gray-300 my-2"> -->

                        <!-- Task Manager -->
                        <li>
                            <a href="#"
                                class="flex items-center justify-between p-3 text-gray-700 hover:bg-gray-200 rounded transition-colors"
                                onclick="toggleSubmenu('taskManager')">
                                <div class="flex items-center">
                                    <i class="fas fa-thumbtack mr-3"></i>
                                    <span>Task Manager</span>
                                </div>
                                <i class="fas fa-chevron-down text-xs" id="taskManagerIcon"></i>
                            </a>
                            <!-- Task Manager Sub-items -->
                            <ul id="taskManagerSubmenu" class="ml-6 mt-2 space-y-1 hidden">
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Create New Task
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Task Set By You
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Task Assigned To You
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Open Task Report
                                    </a>
                                </li>

                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Add/Edit Classifications
                                    </a>
                                </li>

                            </ul>
                        </li>

                        <hr class="border-gray-300 my-2">

                        <!-- Users -->
                        <li>
                            <a href="#"
                                class="flex items-center justify-between p-3 text-gray-700 hover:bg-gray-200 rounded transition-colors"
                                onclick="toggleSubmenu('users')">
                                <div class="flex items-center">
                                    <i class="fas fa-users mr-3"></i>
                                    <span>Users</span>
                                </div>
                                <i class="fas fa-chevron-down text-xs" id="usersIcon"></i>
                            </a>
                            <!-- Users Sub-items -->
                            <ul id="usersSubmenu" class="ml-6 mt-2 space-y-1 hidden">
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Users
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Search Users
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Personnel Privileges
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Quick Add User
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Onboarder
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Daily Availability
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Change Access
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Personnel Licences
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Req'd Licences
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Enter Blockout
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Set No Block Dates
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Rank by Personnel
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Rank by Location
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Contractors
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Check a Security Licence
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Search ID Numbers
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Roles
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        HR Reports
                                    </a>
                                </li>
                            </ul>
                        </li>

                        <hr class="border-gray-300 my-2">

                        <!-- Locations -->
                        <li>
                            <a href="#"
                                class="flex items-center justify-between p-3 text-gray-700 hover:bg-gray-200 rounded transition-colors"
                                onclick="toggleSubmenu('locations')">
                                <div class="flex items-center">
                                    <i class="fas fa-map-marker-alt mr-3"></i>
                                    <span>Locations</span>
                                </div>
                                <i class="fas fa-chevron-down text-xs" id="locationsIcon"></i>
                            </a>
                            <!-- Locations Sub-items -->
                            <ul id="locationsSubmenu" class="ml-6 mt-2 space-y-1 hidden">
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Add a Location
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Locations
                                    </a>
                                </li>

                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Location Groups
                                    </a>
                                </li>

                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Location Categories
                                    </a>
                                </li>

                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Location Regions
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Local Public Holidays
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Events
                                    </a>
                                </li>

                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Import Event
                                    </a>
                                </li>

                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Resources Config
                                    </a>
                                </li>

                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Resources Outstanding
                                    </a>
                                </li>

                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Key Register
                                    </a>
                                </li>

                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Purchase Orders
                                    </a>
                                </li>
                            </ul>
                        </li>

                        <hr class="border-gray-300 my-2">

                        <!-- Mobile -->
                        <li>
                            <a href="#"
                                class="flex items-center justify-between p-3 text-gray-700 hover:bg-gray-200 rounded transition-colors"
                                onclick="toggleSubmenu('mobile')">
                                <div class="flex items-center">
                                    <i class="fas fa-car mr-3"></i>
                                    <span>Mobile</span>
                                </div>
                                <i class="fas fa-chevron-down text-xs" id="mobileIcon"></i>
                            </a>
                            <!-- Mobile Sub-items -->
                            <ul id="mobileSubmenu" class="ml-6 mt-2 space-y-1 hidden">
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Mobile Routes
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Mobile Bulk Functions
                                    </a>
                                </li>

                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Mobile Route Reports
                                    </a>
                                </li>

                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Mobile Route Replay
                                    </a>
                                </li>

                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Locations
                                    </a>
                                </li>

                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Service Type Config
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Patrols On Shift
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Log Emergency Response
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Emergency Responses
                                    </a>
                                </li>
                            </ul>
                        </li>

                        <hr class="border-gray-300 my-2">

                        <!-- Supported Living -->
                        <li>
                            <a href="#"
                                class="flex items-center justify-between p-3 text-gray-700 hover:bg-gray-200 rounded transition-colors"
                                onclick="toggleSubmenu('supportedLiving')">
                                <div class="flex items-center">
                                    <i class="fas fa-plus-square mr-3"></i>
                                    <span>Supported Living</span>
                                </div>
                                <i class="fas fa-chevron-down text-xs" id="supportedLivingIcon"></i>
                            </a>
                            <!-- Supported Living Sub-items -->
                            <ul id="supportedLivingSubmenu" class="ml-6 mt-2 space-y-1 hidden">
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Clients
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Add Clients to Clinicians
                                    </a>
                                </li>

                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Enter Into Comms Book
                                    </a>
                                </li>

                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        View Comms Book
                                    </a>
                                </li>

                            </ul>
                        </li>

                        <hr class="border-gray-300 my-2">

                        <!-- Reports -->
                        <li>
                            <a href="#"
                                class="flex items-center justify-between p-3 text-gray-700 hover:bg-gray-200 rounded transition-colors"
                                onclick="toggleSubmenu('reports')">
                                <div class="flex items-center">
                                    <i class="fas fa-file-alt mr-3"></i>
                                    <span>Reports</span>
                                </div>
                                <i class="fas fa-chevron-down text-xs" id="reportsIcon"></i>
                            </a>
                            <!-- Reports Sub-items -->
                            <ul id="reportsSubmenu" class="ml-6 mt-2 space-y-1 hidden">
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        View Summary Reports
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        View Individual Reports
                                    </a>
                                </li>

                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Build a Report
                                    </a>
                                </li>

                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Your Reports
                                    </a>
                                </li>

                            </ul>
                        </li>

                        <hr class="border-gray-300 my-2">

                        <!-- Rosters -->
                        <li>
                            <a href="#"
                                class="flex items-center justify-between p-3 text-gray-700 hover:bg-gray-200 rounded transition-colors"
                                onclick="toggleSubmenu('rosters')">
                                <div class="flex items-center">
                                    <i class="fas fa-calendar mr-3"></i>
                                    <span>Rosters</span>
                                </div>
                                <i class="fas fa-chevron-down text-xs" id="rostersIcon"></i>
                            </a>
                            <!-- Rosters Sub-items -->
                            <ul id="rostersSubmenu" class="ml-6 mt-2 space-y-1 hidden">
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Rosters Beta
                                    </a>
                                </li>

                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Rosters
                                    </a>
                                </li>

                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Runsheets
                                    </a>
                                </li>

                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Unaccepted Shift
                                    </a>
                                </li>

                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Unaccept a shift
                                    </a>
                                </li>

                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Unfilled Contractor Shifts
                                    </a>
                                </li>

                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Shift by Personnel
                                    </a>
                                </li>

                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Commit All Shifts
                                    </a>
                                </li>

                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Hardcap Exception Report
                                    </a>
                                </li>

                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        View All Rosters
                                    </a>
                                </li>

                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Rosters Summary
                                    </a>
                                </li>

                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Today's Status
                                    </a>
                                </li>

                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Static Shift Location
                                    </a>
                                </li>

                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        NOC Board
                                    </a>
                                </li>

                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Ad-Hoc Shift
                                    </a>
                                </li>

                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        View Blockouts
                                    </a>
                                </li>

                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Bulk Replace Personnel
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Who's Free
                                    </a>
                                </li>
                            </ul>
                        </li>

                        <hr class="border-gray-300 my-2">

                        <!-- Timesheets -->
                        <li>
                            <a href="#"
                                class="flex items-center justify-between p-3 text-gray-700 hover:bg-gray-200 rounded transition-colors"
                                onclick="toggleSubmenu('timesheets')">
                                <div class="flex items-center">
                                    <i class="fas fa-clock mr-3"></i>
                                    <span>Timesheets</span>
                                </div>
                                <i class="fas fa-chevron-down text-xs" id="timesheetsIcon"></i>
                            </a>
                            <!-- Timesheets Sub-items -->
                            <ul id="timesheetsSubmenu" class="ml-6 mt-2 space-y-1 hidden">
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        By Location
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        By Location Group
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        By Personnel
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        By Contractor
                                    </a>
                                </li>

                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Location Invoicing
                                    </a>
                                </li>

                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        All Locations
                                    </a>
                                </li>

                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        By Single User
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Single Location Spreadsheet
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Location Group Spreadsheet
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Active Users
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Static Location Tracking
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Event Package
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        No Show Report
                                    </a>
                                </li>
                            </ul>
                        </li>

                        <hr class="border-gray-300 my-2">

                        <!-- Quotations (Selected) -->
                        <li>
                            <a href="#"
                                class="flex items-center justify-between p-3 text-blue-600 bg-blue-50 rounded transition-colors"
                                onclick="toggleSubmenu('quotations')">
                                <div class="flex items-center">
                                    <i class="fas fa-file-invoice-dollar mr-3 text-blue-600"></i>
                                    <span>Quotations</span>
                                </div>
                                <i class="fas fa-chevron-down text-xs text-blue-600" id="quotationsIcon"></i>
                            </a>
                            <!-- Quotations Sub-items -->
                            <ul id="quotationsSubmenu" class="ml-6 mt-2 space-y-1 hidden">
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-blue-600 hover:bg-blue-100 rounded text-sm">
                                        Create Quotation
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-blue-600 hover:bg-blue-100 rounded text-sm">
                                        View Quotations
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-blue-600 hover:bg-blue-100 rounded text-sm">
                                        Quotation History
                                    </a>
                                </li>
                            </ul>
                        </li>

                        <hr class="border-gray-300 my-2">

                        <!-- IR's & Logs -->
                        <li>
                            <a href="#"
                                class="flex items-center justify-between p-3 text-gray-700 hover:bg-gray-200 rounded transition-colors"
                                onclick="toggleSubmenu('irsLogs')">
                                <div class="flex items-center">
                                    <i class="fas fa-exclamation-triangle mr-3"></i>
                                    <span>IR's & Logs</span>
                                </div>
                                <i class="fas fa-chevron-down text-xs" id="irsLogsIcon"></i>
                            </a>
                            <!-- IR's & Logs Sub-items -->
                            <ul id="irsLogsSubmenu" class="ml-6 mt-2 space-y-1 hidden">
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Search IR's
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Activity Logs
                                    </a>
                                </li>
                            </ul>
                        </li>

                        <hr class="border-gray-300 my-2">

                        <!-- Documents -->
                        <li>
                            <a href="#"
                                class="flex items-center justify-between p-3 text-gray-700 hover:bg-gray-200 rounded transition-colors"
                                onclick="toggleSubmenu('documents')">
                                <div class="flex items-center">
                                    <i class="fas fa-copy mr-3"></i>
                                    <span>Documents</span>
                                </div>
                                <i class="fas fa-chevron-down text-xs" id="documentsIcon"></i>
                            </a>
                            <!-- Documents Sub-items -->
                            <ul id="documentsSubmenu" class="ml-6 mt-2 space-y-1 hidden">
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Add/Edit Categories
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Add/Edit Documents
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Search by Personnel
                                    </a>
                                </li>

                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Your Documents
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Master Licence
                                    </a>
                                </li>

                            </ul>
                        </li>

                        <hr class="border-gray-300 my-2">

                        <!-- Messaging -->
                        <li>
                            <a href="#"
                                class="flex items-center justify-between p-3 text-gray-700 hover:bg-gray-200 rounded transition-colors"
                                onclick="toggleSubmenu('messaging')">
                                <div class="flex items-center">
                                    <i class="fas fa-comments mr-3"></i>
                                    <span>Messaging</span>
                                </div>
                                <i class="fas fa-chevron-down text-xs" id="messagingIcon"></i>
                            </a>
                            <!-- Messaging Sub-items -->
                            <ul id="messagingSubmenu" class="ml-6 mt-2 space-y-1 hidden">
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Send a Message
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Sent Messages
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Enter into Comms Book
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        View Comms Book
                                    </a>
                                </li>

                            </ul>
                        </li>

                        <hr class="border-gray-300 my-2">

                        <!-- What's New -->
                        <li>
                            <a href="#"
                                class="flex items-center justify-between p-3 text-gray-700 hover:bg-gray-200 rounded transition-colors">
                                <div class="flex items-center">
                                    <i class="fas fa-thumbs-up mr-3"></i>
                                    <span>What's New</span>
                                </div>
                                <i class="fas fa-chevron-down text-xs"></i>
                            </a>
                        </li>

                        <hr class="border-gray-300 my-2">

                        <!-- Help & Support -->
                        <li>
                            <a href="#"
                                class="flex items-center justify-between p-3 text-gray-700 hover:bg-gray-200 rounded transition-colors"
                                onclick="toggleSubmenu('helpSupport')">
                                <div class="flex items-center">
                                    <i class="fas fa-life-ring mr-3"></i>
                                    <span>Help & Support</span>
                                </div>
                                <i class="fas fa-chevron-down text-xs" id="helpSupportIcon"></i>
                            </a>
                            <!-- Help & Support Sub-items -->
                            <ul id="helpSupportSubmenu" class="ml-6 mt-2 space-y-1 hidden">
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Help
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Open Tickets
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Closed Tickets
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        New Ticket
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Admin Open Tickets
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Admin Closed Tickets
                                    </a>
                                </li>
                                <li>
                                    <a href="#"
                                        class="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded text-sm">
                                        Securecy Stats
                                    </a>
                                </li>
                            </ul>
                        </li>

                        <hr class="border-gray-300 my-2">

                        <!-- Logout -->
                        <li>
                            <a href="#"
                                class="flex items-center p-3 text-gray-700 hover:bg-gray-200 rounded transition-colors">
                                <div class="flex items-center">
                                    <i class="fas fa-sign-out-alt mr-3"></i>
                                    <span>Logout</span>
                                </div>
                            </a>
                        </li>
                    </ul>
                </nav>

                <!-- Sidebar Toggle Button -->
                <div class="border-t border-gray-300 p-4">
                    <button
                        class="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors flex items-center justify-center">
                        <i class="fas fa-chevron-left text-xs"></i>
                    </button>
                </div>
            </div>
        @endif

        <!-- Main Content Area -->
        <div class="flex-1 bg-white">
            <!-- User Profile Image Trigger (moved from header) -->
            <div class="flex justify-end p-6 pb-0">
                <div id="profile-container" class="relative inline-block">
                    <img src="{{ asset('images/default-profile.svg') }}" alt="Profile" id="profile-img"
                        class="w-12 h-12 rounded-full object-cover cursor-pointer border-2 border-gray-300 hover:border-blue-400 transition-colors">
                </div>
            </div>
            @if (Route::currentRouteName() !== 'login')

                <!-- User Info -->
                <div class="p-6 pt-0">
                    @if (request()->cookie('jwt_token'))
                        @php
                            $jwt = request()->cookie('jwt_token');
                            $decoded = \Firebase\JWT\JWT::decode(
                                $jwt,
                                new \Firebase\JWT\Key(env('JWT_SECRET', 'changeme'), 'HS256'),
                            );
                            $decodedArray = (array) $decoded;
                            Log::info('Decoded JWT payload', $decodedArray);
                        @endphp

                        <p class="text-black text-sm">
                            <!-- Profile Modal - Only show when not on login page -->
                            @if (Route::currentRouteName() !== 'login')
                                <div id="profile-modal" class="profile-modal">
                                    <div class="profile-modal-content">
                                        <!-- Tabs -->
                                        <div class="flex border-b border-gray-200">
                                            <button id="tab-general"
                                                class="profile-tab active flex-1 py-4 px-6 border-none bg-transparent font-semibold cursor-pointer transition-colors">
                                                General
                                            </button>
                                            <button id="tab-personnel"
                                                class="profile-tab flex-1 py-4 px-6 border-none bg-transparent font-semibold cursor-pointer transition-colors">
                                                Switch to Personnel
                                            </button>
                                            <button id="close-profile-modal"
                                                class="py-4 px-6 border-none bg-transparent text-xl cursor-pointer hover:bg-gray-100 transition-colors">
                                                &times;
                                            </button>
                                        </div>

                                        <!-- Tab Contents -->
                                        <div id="tab-content-general" class="profile-tab-content p-6">
                                            <h3 class="text-xl font-semibold mb-4">Your Details</h3>
                                            <p class="text-gray-600 mb-4">Please fill in any missing details or change
                                                any that need updating.</p>
                                            <div
                                                class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                                                <strong>Note:</strong> Your employer has requested that you did not
                                                update your details. Should you need any changes, please contact them
                                                directly.
                                            </div>

                                            <form class="space-y-4">
                                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label
                                                            class="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                                        <input type="text" value="zrtest1" readonly
                                                            class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                                    </div>
                                                    <div>
                                                        <label
                                                            class="block text-sm font-medium text-gray-700 mb-1">Email
                                                            Address</label>
                                                        <input type="email" value="zac@securecy.com.au" readonly
                                                            class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                                    </div>
                                                    <div>
                                                        <label
                                                            class="block text-sm font-medium text-gray-700 mb-1">First
                                                            Name</label>
                                                        <input type="text" value="ZR" readonly
                                                            class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                                    </div>
                                                    <div>
                                                        <label
                                                            class="block text-sm font-medium text-gray-700 mb-1">Middle
                                                            Name(s)</label>
                                                        <input type="text" value="" readonly
                                                            class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                                    </div>
                                                    <div>
                                                        <label
                                                            class="block text-sm font-medium text-gray-700 mb-1">Surname</label>
                                                        <input type="text" value="Test1" readonly
                                                            class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                                    </div>
                                                    <div>
                                                        <label
                                                            class="block text-sm font-medium text-gray-700 mb-1">Preferred/Nickname</label>
                                                        <input type="text" value="" readonly
                                                            class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                                    </div>
                                                    <div>
                                                        <label
                                                            class="block text-sm font-medium text-gray-700 mb-1">Date
                                                            of Birth</label>
                                                        <input type="date" value="" readonly
                                                            class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                                    </div>
                                                    <div>
                                                        <label
                                                            class="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                                        <input type="text" value="Australia" readonly
                                                            class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                                    </div>
                                                </div>

                                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label
                                                            class="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                                        <input type="text" value="" readonly
                                                            class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                                    </div>
                                                    <div>
                                                        <label
                                                            class="block text-sm font-medium text-gray-700 mb-1">Suburb</label>
                                                        <input type="text" value="" readonly
                                                            class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                                    </div>
                                                    <div>
                                                        <label
                                                            class="block text-sm font-medium text-gray-700 mb-1">State</label>
                                                        <input type="text" value="" readonly
                                                            class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                                    </div>
                                                    <div>
                                                        <label
                                                            class="block text-sm font-medium text-gray-700 mb-1">Post
                                                            Code</label>
                                                        <input type="text" value="" readonly
                                                            class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                                    </div>
                                                </div>

                                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label
                                                            class="block text-sm font-medium text-gray-700 mb-1">Landline</label>
                                                        <input type="text" value="(99) 9999 9999" readonly
                                                            class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                                    </div>
                                                    <div>
                                                        <label
                                                            class="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                                                        <input type="text" value="0449 098 998" readonly
                                                            class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                                    </div>
                                                </div>

                                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label
                                                            class="block text-sm font-medium text-gray-700 mb-1">I.C.E.
                                                            Full Name</label>
                                                        <input type="text" value="" readonly
                                                            class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                                    </div>
                                                    <div>
                                                        <label
                                                            class="block text-sm font-medium text-gray-700 mb-1">I.C.E.
                                                            Landline</label>
                                                        <input type="text" value="(99) 9999 9999" readonly
                                                            class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                                    </div>
                                                    <div>
                                                        <label
                                                            class="block text-sm font-medium text-gray-700 mb-1">I.C.E.
                                                            Mobile</label>
                                                        <input type="text" value="9999 999 999" readonly
                                                            class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                                    </div>
                                                    <div>
                                                        <label
                                                            class="block text-sm font-medium text-gray-700 mb-1">I.C.E.
                                                            Email</label>
                                                        <input type="email" value="" readonly
                                                            class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                                    </div>
                                                </div>

                                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label
                                                            class="block text-sm font-medium text-gray-700 mb-1">Previous
                                                            Experience</label>
                                                        <input type="text" value="" readonly
                                                            class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                                    </div>
                                                    <div>
                                                        <label
                                                            class="block text-sm font-medium text-gray-700 mb-1">Start
                                                            Date</label>
                                                        <input type="date" value="" readonly
                                                            class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                                    </div>
                                                </div>

                                                <div>
                                                    <label
                                                        class="block text-sm font-medium text-gray-700 mb-1">Personal
                                                        Interests & Hobbies</label>
                                                    <input type="text" value="" readonly
                                                        class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                                </div>

                                                <div>
                                                    <label
                                                        class="block text-sm font-medium text-gray-700 mb-1">Community/Volunteer
                                                        Projects</label>
                                                    <input type="text" value="" readonly
                                                        class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                                </div>

                                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label
                                                            class="block text-sm font-medium text-gray-700 mb-1">Your
                                                            Photo</label>
                                                        <input type="file" disabled
                                                            class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100">
                                                    </div>
                                                    <div>
                                                        <label
                                                            class="block text-sm font-medium text-gray-700 mb-1">Your
                                                            Current Photo</label>
                                                        <img src="{{ asset('images/default-profile.svg') }}"
                                                            class="w-12 h-12 rounded-full object-cover border-2 border-gray-300">
                                                    </div>
                                                </div>

                                                <div>
                                                    <label class="block text-sm font-medium text-gray-700 mb-1">View
                                                        Preference</label>
                                                    <select disabled
                                                        class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100">
                                                        <option selected>Light</option>
                                                    </select>
                                                </div>
                                            </form>
                                        </div>

                                        <div id="tab-content-personnel" class="profile-tab-content p-6"
                                            style="display: none;">
                                            <h3 class="text-xl font-semibold mb-4">Hi ZR, ending your shift late?</h3>
                                            <p class="text-gray-600 mb-4">
                                                You're were rostered to finish at 09:00,<br>
                                                ONLY if you've been asked to stay late, press the red button.<br>
                                                If you just want to end your shift at the rostered time of 09:00, press
                                                the green button.
                                            </p>

                                            <div class="flex space-x-4 mb-6">
                                                <button
                                                    class="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md transition-colors">
                                                    End at 09:00
                                                </button>
                                                <button
                                                    class="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-md transition-colors">
                                                    Stay Late
                                                </button>
                                            </div>

                                            <hr class="border-gray-300 my-6">

                                            <h4 class="text-lg font-semibold mb-2">Licences Your Licences &
                                                Qualifications</h4>
                                            <p class="text-gray-600 mb-4">You don't have any Licenses or Qualifications
                                                entered.</p>

                                            <h4 class="text-lg font-semibold mb-2">Your Shifts</h4>
                                            <ul class="list-disc list-inside text-gray-600 mb-4">
                                                <li>Unconfirmed Shifts</li>
                                                <li>Upcoming Shifts</li>
                                                <li>Past Shifts</li>
                                            </ul>

                                            <hr class="border-gray-300 my-6">

                                            <div class="space-y-4">
                                                <div>
                                                    <h4 class="text-lg font-semibold mb-2">Kitchen report</h4>
                                                    <p class="text-gray-600">Kitchen Shutdown Sequence<br>Last report
                                                        filed Tuesday 8th 12:55</p>
                                                </div>

                                                <div>
                                                    <h4 class="text-lg font-semibold mb-2">Pub Complete Report</h4>
                                                    <p class="text-gray-600">Field Test<br>Last report filed Wednesday
                                                        27th 23:37</p>
                                                </div>

                                                <div>
                                                    <h4 class="text-lg font-semibold mb-2">Car inspect</h4>
                                                    <p class="text-gray-600">Car inspect<br>No Reports Filed</p>
                                                </div>

                                                <div>
                                                    <h4 class="text-lg font-semibold mb-2">Lighting</h4>
                                                    <p class="text-gray-600">Report Lighting Issues<br>Last report
                                                        filed Wednesday 10th 17:32</p>
                                                </div>

                                                <div>
                                                    <h4 class="text-lg font-semibold mb-2">Test Report</h4>
                                                    <p class="text-gray-600">Ghgis is a test report<br>No Reports Filed
                                                    </p>
                                                </div>

                                                <div>
                                                    <h4 class="text-lg font-semibold mb-2">Sample One2One</h4>
                                                    <p class="text-gray-600">This is a sample report<br>Last report
                                                        filed Monday 26th 13:08</p>
                                                </div>

                                                <div>
                                                    <h4 class="text-lg font-semibold mb-2">Day 1 Report</h4>
                                                    <p class="text-gray-600">Static Shift 1<br>No Reports Filed</p>
                                                </div>

                                                <div>
                                                    <h4 class="text-lg font-semibold mb-2">Dail;y Report</h4>
                                                    <p class="text-gray-600">Report<br>No Reports Filed</p>
                                                </div>

                                                <div>
                                                    <h4 class="text-lg font-semibold mb-2">Day 1 Report</h4>
                                                    <p class="text-gray-600">Static Shift 1<br>No Reports Filed</p>
                                                </div>

                                                <div>
                                                    <h4 class="text-lg font-semibold mb-2">Lionheart Day Start</h4>
                                                    <p class="text-gray-600">Subtitle<br>No Reports Filed</p>
                                                </div>

                                                <div>
                                                    <h4 class="text-lg font-semibold mb-2">WCG Test</h4>
                                                    <p class="text-gray-600">Optional Field<br>No Reports Filed</p>
                                                </div>

                                                <div>
                                                    <h4 class="text-lg font-semibold mb-2">This is a Self Serve HR
                                                        Report</h4>
                                                </div>
                                            </div>

                                            <footer
                                                class="text-center text-gray-500 mt-8 pt-4 border-t border-gray-300">
                                                © 2015 - 2025 Securecy Pty Ltd
                                            </footer>
                                        </div>
                                    </div>
                                </div>
                            @endif
                        </p>
                        <!-- <p class="text-black text-sm">Logged in as {{ $decodedArray['name'] ?? 'Unknown' }}. User Access Level is {{ $decodedArray['role'] ?? 'Unknown' }}</p>
@else
<p class="text-black text-sm">User information not available.</p>
                @endif
            </div> -->
                    @endif
                    <!-- Page Content -->
                    <div class=" pb-6 pt-0">
                        @yield('content')
                    </div>
                </div>
        </div>


        <script>
            // Function to toggle submenu visibility
            function toggleSubmenu(menuId) {
                const submenu = document.getElementById(menuId + 'Submenu');
                const icon = document.getElementById(menuId + 'Icon');

                if (submenu.classList.contains('hidden')) {
                    submenu.classList.remove('hidden');
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-chevron-up');
                } else {
                    submenu.classList.add('hidden');
                    icon.classList.remove('fa-chevron-up');
                    icon.classList.add('fa-chevron-down');
                }
            }

            // Profile Modal Functionality
            document.addEventListener('DOMContentLoaded', function() {
                const profileImg = document.getElementById('profile-img');
                const profileModal = document.getElementById('profile-modal');
                const closeModal = document.getElementById('close-profile-modal');
                const tabGeneral = document.getElementById('tab-general');
                const tabPersonnel = document.getElementById('tab-personnel');
                const contentGeneral = document.getElementById('tab-content-general');
                const contentPersonnel = document.getElementById('tab-content-personnel');

                // Open modal when profile image is clicked
                if (profileImg) {
                    profileImg.addEventListener('click', function() {
                        profileModal.style.display = 'flex';
                        // Reset to General tab
                        tabGeneral.classList.add('active');
                        tabPersonnel.classList.remove('active');
                        contentGeneral.style.display = 'block';
                        contentPersonnel.style.display = 'none';
                    });
                }

                // Close modal when X button is clicked
                if (closeModal) {
                    closeModal.addEventListener('click', function() {
                        profileModal.style.display = 'none';
                    });
                }

                // Switch to General tab
                if (tabGeneral) {
                    tabGeneral.addEventListener('click', function() {
                        this.classList.add('active');
                        tabPersonnel.classList.remove('active');
                        contentGeneral.style.display = 'block';
                        contentPersonnel.style.display = 'none';
                    });
                }

                // Switch to Personnel tab
                if (tabPersonnel) {
                    tabPersonnel.addEventListener('click', function() {
                        this.classList.add('active');
                        tabGeneral.classList.remove('active');
                        contentGeneral.style.display = 'none';
                        contentPersonnel.style.display = 'block';
                    });
                }

                // Close modal when clicking outside
                if (profileModal) {
                    profileModal.addEventListener('click', function(e) {
                        if (e.target === this) {
                            this.style.display = 'none';
                        }
                    });
                }
            });
        </script>
</body>

</html>
