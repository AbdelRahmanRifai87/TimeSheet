<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithEvents;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use Maatwebsite\Excel\Concerns\WithMapping;
use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\FromCollection;

class TimesheetExport implements FromCollection, WithHeadings, WithStyles, WithEvents, WithMapping
{
    protected $data;
    protected $headings;
    protected $hiddenColumns;
    protected $totals;
    protected $weekGroups;
    private $currentRow = 0;
    

    public function __construct(array $data, array $headings, array $hiddenColumns = [], array $totals = [], array $weekGroups = [])
    {
        $this->data = $data;
        $this->headings = $headings;
        $this->hiddenColumns = $hiddenColumns;
        $this->totals = $totals;
        $this->weekGroups = $weekGroups;
        $this->currentRow = 0; // Initialize current row counter
    }

    // public function array(): array
    // {
    //     $rows = [];
    //     $filteredHeadings = $this->headings();
    //     $publicHolidayColIndex = array_search('Public Holiday', $filteredHeadings);
    //     $startDateColIndex = array_search('Start Date', $filteredHeadings);

    //     // Add data rows (filtering out hidden columns and formatting values)
    //     foreach ($this->data as $row) {
    //         $filteredRow = [];
    //         foreach ($row as $index => $value) {
    //             if (!in_array($index, $this->hiddenColumns)) {
    //                 // Format specific columns
    //                 $filteredRow[] = $this->formatCellValue($value, $index);
    //             }
    //         }
    //         if (
    //             $publicHolidayColIndex !== false &&
    //             $startDateColIndex !== false &&
    //             floatval($filteredRow[$publicHolidayColIndex] ?? 0) > 0
    //         ) {
    //             $filteredRow[$startDateColIndex] .= ' PH';
    //         }
    //         $rows[] = $filteredRow;
    //     }

    //     // Add totals row if provided
    //     if (!empty($this->totals)) {
    //         $totalsRow = $this->createTotalsRow();
    //         $rows[] = $totalsRow;
    //     }

    //     return $rows;
    // }
public function collection()
{
    $rows = $this->data;
    if (!empty($this->totals)) {
        $rows[] = $this->createTotalsRow();
    }
    return collect($rows);
}
    private function formatCellValue($value, $columnIndex,$row = [])
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
        // Format Start Date column and append ' PH' if public holiday
if (strpos($heading, 'Start Date') !== false) {
    // Format the date as before
    if ($value && $value !== '' && $value !== null) {
        try {
            $date = \Carbon\Carbon::parse($value);
            $formatted = $date->format('D d/m/Y');
        } catch (\Exception $e) {
            $formatted = $value;
        }
    } else {
        $formatted = $value;
    }

    // Check if PH column exists and is set for this row
    $phColIndex = array_search('PH', $this->headings);
    if ($phColIndex !== false && isset($row[$phColIndex]) && floatval($row[$phColIndex]) > 0) {
        $formatted .= ' PH';
    }
    return $formatted;
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
                return $value;
            }
            // Try to extract a number from a string like "$0.00"
    if (is_string($value) && preg_match('/[\d.]+/', $value, $matches)) {
        return $matches[0];
    }
            return ''; // Empty for zero rates
        }

        // Format hour columns - show with 2 decimal places
        if (
            strpos(strtolower($heading), 'hour') !== false ||
            strpos(strtolower($heading), 'day (0600–1800)') !== false ||
            strpos(strtolower($heading), 'night (1800–0600)') !== false ||
            strpos(strtolower($heading), 'saturday') !== false ||
            strpos(strtolower($heading), 'sunday') !== false ||
            strpos(strtolower($heading), 'ph') !== false
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
    $filteredHeadings = $this->headings();
    $dataRowCount = count($this->data);
    $startRow = 2; // Data starts at row 2 (row 1 is headings)
    $endRow = $dataRowCount + 1; // Last data row

    foreach ($filteredHeadings as $index => $heading) {
        if (!in_array($index, $this->hiddenColumns)) {
            $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($index + 1);

            // Only sum columns that are hours, billable, etc. NOT rates
            if (
                strpos($heading, 'Scheduled Hours') !== false ||
                strpos($heading, 'Day (0600–1800)') !== false ||
                strpos($heading, 'Night (1800–0600)') !== false ||
                strpos($heading, 'Saturday') !== false ||
                strpos($heading, 'Sunday') !== false ||
                (strpos($heading, 'PH') !== false && strpos(strtolower($heading), 'rate') === false)
            ) {
                $totalsRow[] = "=SUM({$colLetter}{$startRow}:{$colLetter}{$endRow})";
            } elseif (strpos(strtolower($heading), 'billable') !== false) {
                // For Client Billable, sum the column
                $totalsRow[] = "=SUM({$colLetter}{$startRow}:{$colLetter}{$endRow})";
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
        $publicHolidayColIndex = array_search('PH', $filteredHeadings);
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
                strpos($heading, 'Date Range') !== false ||
                strpos($heading, 'Start Date') !== false ||
                strpos($heading, 'Scheduled Start') !== false ||
                strpos($heading, 'Scheduled Finish') !== false ||
                strpos($heading, 'Scheduled Hours') !== false ||
                strpos($heading, 'Emp. Numb') !== false
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
                strpos($heading, 'Day (0600–1800)') !== false ||
                strpos($heading, 'Night (1800–0600)') !== false ||
                strpos($heading, 'Saturday') !== false ||
                strpos($heading, 'Sunday') !== false ||
                strpos($heading, 'PH') !== false
            ) {
                $sheet->getStyle("{$col}1:{$col}{$highestRow}")
                    ->getFill()->setFillType(Fill::FILL_SOLID)
                    ->getStartColor()->setRGB('E5E5E5'); // Light gray
            }
        }
    }

   public function map($row): array
{
    $mapped = [];
    $filteredHeadings = $this->headings();
    $excelRow = $this->currentRow + 2;
    $isTotalsRow = !empty($this->totals) && $this->currentRow === count($this->data);

    // Find column indexes
    $colIndexes = [
        'emp'      => array_search('Emp. Numb', $filteredHeadings),
        'dayH'     => array_search('Day (0600–1800)', $filteredHeadings),
        'nightH'   => array_search('Night (1800–0600)', $filteredHeadings),
        'satH'     => array_search('Saturday', $filteredHeadings),
        'sunH'     => array_search('Sunday', $filteredHeadings),
        'phH'      => array_search('PH', $filteredHeadings),
        'dayR'     => array_search('Client Day Rate', $filteredHeadings),
        'nightR'   => array_search('Client Night Rate', $filteredHeadings),
        'satR'     => array_search('Client Sat Rate', $filteredHeadings),
        'sunR'     => array_search('Client Sun Rate', $filteredHeadings),
        'phR'      => array_search('Client PH Rate', $filteredHeadings),
        'billable' => array_search('Client Billable', $filteredHeadings),
    ];

    foreach ($filteredHeadings as $index => $heading) {
        if (in_array($index, $this->hiddenColumns)) continue;

        if ($index === $colIndexes['billable']) {
            $billableCol = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIndexes['billable'] + 1);
            $startRow = 2;
            $endRow = count($this->data) + 1;

            if ($isTotalsRow) {
                // For totals row, sum the billable column
                $mapped[] = "=SUM({$billableCol}{$startRow}:{$billableCol}{$endRow})";
            } else {
                // For data rows, use the per-row formula
                $empCol    = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIndexes['emp'] + 1);
                $dayHCol   = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIndexes['dayH'] + 1);
                $nightHCol = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIndexes['nightH'] + 1);
                $satHCol   = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIndexes['satH'] + 1);
                $sunHCol   = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIndexes['sunH'] + 1);
                $phHCol    = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIndexes['phH'] + 1);

                $dayRCol   = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIndexes['dayR'] + 1);
                $nightRCol = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIndexes['nightR'] + 1);
                $satRCol   = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIndexes['satR'] + 1);
                $sunRCol   = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIndexes['sunR'] + 1);
                $phRCol    = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIndexes['phR'] + 1);

                $mapped[] = "={$empCol}{$excelRow}*( {$dayHCol}{$excelRow}*{$dayRCol}{$excelRow} + {$nightHCol}{$excelRow}*{$nightRCol}{$excelRow} + {$satHCol}{$excelRow}*{$satRCol}{$excelRow} + {$sunHCol}{$excelRow}*{$sunRCol}{$excelRow} + {$phHCol}{$excelRow}*{$phRCol}{$excelRow} )";
            }
        } else {
            $mapped[] = $this->formatCellValue($row[$index], $index, $row);
        }
    }
    $this->currentRow++;
    return $mapped;
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
