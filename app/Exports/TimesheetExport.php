<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithEvents;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use Carbon\Carbon;

class TimesheetExport implements FromArray, WithHeadings, WithStyles, WithEvents
{
    protected $data;
    protected $headings;
    protected $hiddenColumns;
    protected $totals;
    protected $weekGroups;

    public function __construct(array $data, array $headings, array $hiddenColumns = [], array $totals = [], array $weekGroups = [])
    {
        $this->data = $data;
        $this->headings = $headings;
        $this->hiddenColumns = $hiddenColumns;
        $this->totals = $totals;
        $this->weekGroups = $weekGroups;
    }

    public function array(): array
    {
        $rows = [];
        $filteredHeadings = $this->headings();
        $publicHolidayColIndex = array_search('Public Holiday', $filteredHeadings);
        $startDateColIndex = array_search('Start Date', $filteredHeadings);

        // Add data rows (filtering out hidden columns and formatting values)
        foreach ($this->data as $row) {
            $filteredRow = [];
            foreach ($row as $index => $value) {
                if (!in_array($index, $this->hiddenColumns)) {
                    // Format specific columns
                    $filteredRow[] = $this->formatCellValue($value, $index);
                }
            }
            if (
                $publicHolidayColIndex !== false &&
                $startDateColIndex !== false &&
                floatval($filteredRow[$publicHolidayColIndex] ?? 0) > 0
            ) {
                $filteredRow[$startDateColIndex] .= ' PH';
            }
            $rows[] = $filteredRow;
        }

        // Add totals row if provided
        if (!empty($this->totals)) {
            $totalsRow = $this->createTotalsRow();
            $rows[] = $totalsRow;
        }

        return $rows;
    }

    private function formatCellValue($value, $columnIndex)
    {
        $heading = $this->headings[$columnIndex] ?? '';

        // Format Week Starting column
        if (strpos($heading, 'Week Starting') !== false) {
            if ($value && $value !== '' && $value !== null) {
                try {
                    $date = \Carbon\Carbon::parse($value);
                    return 'W.E ' . $date->format('d-m-Y');
                } catch (\Exception $e) {
                    return $value;
                }
            }
        }

        // Format date columns
        if (strpos($heading, 'Date') !== false) {
            if ($value && $value !== '' && $value !== null) {
                try {
                    $date = \Carbon\Carbon::parse($value);
                    return $date->format('D d/m/Y');
                } catch (\Exception $e) {
                    return $value;
                }
            }
        }

        // Format currency columns (rates and billable)
        if (
            strpos(strtolower($heading), 'rate') !== false ||
            strpos(strtolower($heading), 'billable') !== false
        ) {
            if (is_numeric($value) && $value > 0) {
                return '$' . number_format($value, 2);
            }
            return ''; // Empty for zero rates
        }

        // Format hour columns - show with 2 decimal places
        if (
            strpos(strtolower($heading), 'hour') !== false ||
            strpos(strtolower($heading), 'day (06–18)') !== false ||
            strpos(strtolower($heading), 'night (18–06)') !== false ||
            strpos(strtolower($heading), 'saturday') !== false ||
            strpos(strtolower($heading), 'sunday') !== false ||
            strpos(strtolower($heading), 'holiday') !== false
        ) {
            if (is_numeric($value)) {
                return number_format($value, 2);
            }
        }

        // Handle empty values
        if ($value === '' || $value === null || $value === 0 || $value === '0') {
            return '';
        }

        // Handle string values that are effectively empty
        if (is_string($value) && trim($value) === '') {
            return '';
        }

        // Handle numeric values that are zero
        if (is_numeric($value) && (float)$value == 0) {
            return '';
        }

        // Handle boolean false
        if ($value === false) {
            return '';
        }

        // Return the original value for everything else
        return $value;
    }

    private function createTotalsRow()
    {
        $totalsRow = [];

        foreach ($this->headings as $index => $heading) {
            if (!in_array($index, $this->hiddenColumns)) {
                // Only show totals for specific columns
                if (strpos($heading, 'Scheduled Hours') !== false) {
                    $totalsRow[] = number_format($this->totals['scheduled_hours'] ?? 0, 2);
                } elseif (strpos($heading, 'Day (06–18)') !== false) {
                    $totalsRow[] = number_format($this->totals['day'] ?? 0, 2);
                } elseif (strpos($heading, 'Night (18–06)') !== false) {
                    $totalsRow[] = number_format($this->totals['night'] ?? 0, 2);
                } elseif (strpos($heading, 'Saturday') !== false) {
                    $totalsRow[] = number_format($this->totals['saturday'] ?? 0, 2);
                } elseif (strpos($heading, 'Sunday') !== false) {
                    $totalsRow[] = number_format($this->totals['sunday'] ?? 0, 2);
                } elseif (strpos($heading, 'Public Holiday') !== false) {
                    $totalsRow[] = number_format($this->totals['public_holiday'] ?? 0, 2);
                } elseif (strpos(strtolower($heading), 'billable') !== false) {
                    $totalsRow[] = '$' . number_format($this->totals['billable'] ?? 0, 2);
                } else {
                    $totalsRow[] = '';
                }
            }
        }

        return $totalsRow;
    }

    public function headings(): array
    {
        $filteredHeadings = [];
        foreach ($this->headings as $index => $heading) {
            if (!in_array($index, $this->hiddenColumns)) {
                $filteredHeadings[] = $heading;
            }
        }
        return $filteredHeadings;
    }

    public function styles(Worksheet $sheet)
    {
        $highestCol = $sheet->getHighestColumn();
        $highestRow = $sheet->getHighestRow();

        // Center align all cells
        $sheet->getStyle("A1:{$highestCol}{$highestRow}")
            ->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle("A1:{$highestCol}{$highestRow}")
            ->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
        $sheet->getStyle("A1:{$highestCol}1")->getFont()->setBold(true);
        $this->applyColumnStyles($sheet, $highestCol, $highestRow);

        // Color each unique week in the Week Starting column
        $filteredHeadings = $this->headings();
        $weekStartingColIndex = array_search('Week Starting', $filteredHeadings);
        if ($weekStartingColIndex !== false && !empty($this->weekGroups)) {
            $weekStartingCol = chr(65 + $weekStartingColIndex); // A, B, C, ...
            $colors = [
                'FFEBEE',
                'E3F2FD',
                'E8F5E9',
                'FFFDE7',
                'F3E5F5',
                'E0F2F1',
                'FFF3E0',
                'FBE9E7',
                'F9FBE7',
                'E1F5FE',
                'FCE4EC',
                'EDE7F6',
                'F1F8E9',
                'FFF8E1',
                'ECEFF1',
                'F9FBE7',
                'E0F7FA',
                'F3E5F5',
                'E8F5E9',
                'FFFDE7',
            ];
            $colorCount = count($colors);
            $rowOffset = 2; // Data starts at row 2 (row 1 is headings)
            foreach ($this->weekGroups as $i => $group) {
                $color = $colors[$i % $colorCount];
                $startRow = $group['start'] + $rowOffset;
                $endRow = $group['end'] + $rowOffset;
                $sheet->getStyle("{$weekStartingCol}{$startRow}:{$weekStartingCol}{$endRow}")
                    ->getFill()->setFillType(Fill::FILL_SOLID)
                    ->getStartColor()->setRGB($color);
            }
        }

        // Style first row "Week Starting" column with red text
        // $filteredHeadings = $this->headings();
        // $weekStartingColIndex = array_search('Week Starting', $filteredHeadings);
        // if ($weekStartingColIndex !== false) {
        //     $weekStartingCol = chr(65 + $weekStartingColIndex); // Convert to letter (A, B, C, etc.)
        //     // Make only the first data row red (row 2, since row 1 is headers)
        //     $sheet->getStyle("{$weekStartingCol}2")
        //         ->getFont()->getColor()->setRGB('FF0000'); // Red text
        // }

        // Style totals row if it exists
        if (!empty($this->totals)) {
            $sheet->getStyle("A{$highestRow}:{$highestCol}{$highestRow}")
                ->getFont()->getColor()->setRGB('FFFFFF'); // White text
            $sheet->getStyle("A{$highestRow}:{$highestCol}{$highestRow}")
                ->getFill()->setFillType(Fill::FILL_SOLID)
                ->getStartColor()->setRGB('003366'); // Dark blue background

            // Make totals row bold
            $sheet->getStyle("A{$highestRow}:{$highestCol}{$highestRow}")
                ->getFont()->setBold(true);
        }

        $filteredHeadings = $this->headings();
        $publicHolidayColIndex = array_search('Public Holiday', $filteredHeadings);
        if ($publicHolidayColIndex !== false) {
            $startRow = 2; // Data starts at row 2 (row 1 is headings)
            $rowCount = count($this->data);
            for ($i = 0; $i < $rowCount; $i++) {
                // Skip totals row if you add it at the end
                if (!empty($this->totals) && $i === $rowCount - 1) {
                    continue;
                }
                $row = $this->data[$i];
                // Adjust for hidden columns
                $filteredRow = [];
                foreach ($row as $index => $value) {
                    if (!in_array($index, $this->hiddenColumns)) {
                        $filteredRow[] = $value;
                    }
                }
                $phValue = $filteredRow[$publicHolidayColIndex] ?? 0;
                if (floatval($phValue) > 0) {
                    $excelRow = $i + $startRow;
                    $colStart = 'A';
                    $colEnd = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex(count($filteredHeadings));
                    $sheet->getStyle("{$colStart}{$excelRow}:{$colEnd}{$excelRow}")
                        ->getFill()->setFillType(Fill::FILL_SOLID)
                        ->getStartColor()->setRGB('E8F5E9'); // Light yellow
                }
            }
        }

        return [];
    }

    private function applyColumnStyles($sheet, $highestCol, $highestRow)
    {
        // Get filtered headings (only visible columns)
        $filteredHeadings = $this->headings();
        $columns = range('A', $highestCol);

        foreach ($columns as $index => $col) {
            $heading = $filteredHeadings[$index] ?? '';

            // Style basic info columns with light blue background
            if (
                strpos($heading, 'Week Starting') !== false ||
                strpos($heading, 'Shift Type') !== false ||
                strpos($heading, 'Location') !== false ||
                strpos($heading, 'Start Date') !== false ||
                strpos($heading, 'Scheduled Start') !== false ||
                strpos($heading, 'Scheduled Finish') !== false ||
                strpos($heading, 'Scheduled Hours') !== false ||
                strpos($heading, 'Employee Number') !== false
            ) {
                $sheet->getStyle("{$col}1:{$col}{$highestRow}")
                    ->getFill()->setFillType(Fill::FILL_SOLID)
                    ->getStartColor()->setRGB('ADD8E6'); // Light blue
            }

            // Style Client Rate columns with light orange background
            if (strpos($heading, 'Client') !== false) {
                $sheet->getStyle("{$col}1:{$col}{$highestRow}")
                    ->getFill()->setFillType(Fill::FILL_SOLID)
                    ->getStartColor()->setRGB('FFE5B4'); // Light orange
            }


            // Style hour columns with gray background
            if (
                strpos($heading, 'Day (06–18)') !== false ||
                strpos($heading, 'Night (18–06)') !== false ||
                strpos($heading, 'Saturday') !== false ||
                strpos($heading, 'Sunday') !== false ||
                strpos($heading, 'Public Holiday') !== false
            ) {
                $sheet->getStyle("{$col}1:{$col}{$highestRow}")
                    ->getFill()->setFillType(Fill::FILL_SOLID)
                    ->getStartColor()->setRGB('E5E5E5'); // Light gray
            }
        }
    }

    public function afterSheet(\Maatwebsite\Excel\Events\AfterSheet $event)
    {
        // Autofit all columns
        $highestCol = $event->sheet->getDelegate()->getHighestColumn();
        $columns = range('A', $highestCol);

        foreach ($columns as $col) {
            $event->sheet->getDelegate()->getColumnDimension($col)->setAutoSize(true);

            // Set minimum width for better appearance
            $currentWidth = $event->sheet->getDelegate()->getColumnDimension($col)->getWidth();
            if ($currentWidth < 10) {
                $event->sheet->getDelegate()->getColumnDimension($col)->setWidth(10);
            }
        }

        // Set row height for better appearance
        $highestRow = $event->sheet->getDelegate()->getHighestRow();
        for ($row = 1; $row <= $highestRow; $row++) {
            $event->sheet->getDelegate()->getRowDimension($row)->setRowHeight(20);
        }
    }

    public function registerEvents(): array
    {
        return [
            \Maatwebsite\Excel\Events\AfterSheet::class => [$this, 'afterSheet'],
        ];
    }
}
