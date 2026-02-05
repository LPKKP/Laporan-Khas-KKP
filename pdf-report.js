// Shared KKP PDF generation - used by index.html (dashboard View PDF) and data.html
(function (global) {
    function safeGetValue(value, fallback) {
        fallback = fallback !== undefined ? fallback : 'N/A';
        return value || value === 0 ? value : fallback;
    }

    function addLogoToPdf(doc) {
        try {
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text('', 160, 20);
        } catch (e) {
            console.log('Logo not added, continuing without it');
        }
    }

    function addDocumentTitle(doc, yPosition) {
        doc.setFontSize(11.5);
        doc.setTextColor(40, 40, 40);
        doc.text("BAHAGIAN TEKNOLOGI MAKLUMAT DAN KOMUNIKASI &", 105, yPosition, { align: 'center' });
        yPosition += 5;
        doc.text("KESELAMATAN KESIHATAN PEKERJAAN", 105, yPosition, { align: 'center' });
        yPosition += 5;
        doc.text("LAPORAN PRESTASI KESELAMATAN & KESIHATAN PEKERJAAN (KKP)", 105, yPosition, { align: 'center' });
        yPosition += 10;
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.3);
        doc.line(15, yPosition, 195, yPosition);
        yPosition += 12;
        return yPosition;
    }

    function addDivisionInfo(doc, data, date, yPosition) {
        doc.setFontSize(11.5);
        doc.setTextColor(0, 0, 0);
        doc.text("MAKLUMAT BAHAGIAN/ZON/UNIT", 15, yPosition);
        yPosition += 6;
        var infoData = [
            ["Bahagian/Zon/Unit", data.division],
            ["Suku Pelaporan", data.quarter],
            ["Tarikh Laporan", date]
        ];
        doc.autoTable({
            startY: yPosition,
            body: infoData,
            theme: 'grid',
            styles: { fontSize: 10, cellPadding: 2, lineColor: [0, 0, 0], lineWidth: 0.2, minCellHeight: 6 },
            margin: { left: 15, right: 15 },
            tableWidth: 'auto'
        });
        return doc.lastAutoTable.finalY + 8;
    }

    function addSectionA(doc, data, yPosition) {
        doc.setFontSize(11.5);
        doc.text("SEKSYEN A : STATISTIK", 15, yPosition);
        yPosition += 6;
        var sectionA = [
            ["1. Jumlah Bilangan Pekerja", data.totalWorkers, data.totalWorkersYTD],
            ["2. Jumlah Cuti Sakit Pekerja Disebabkan Kemalangan", data.sickLeave, data.sickLeaveYTD]
        ];
        doc.autoTable({
            startY: yPosition,
            head: [['PERKARA', 'BILANGAN', 'BILANGAN TAHUN INI']],
            body: sectionA,
            theme: 'grid',
            headStyles: { fillColor: [13, 59, 44], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10, halign: 'center' },
            columnStyles: { 0: { cellWidth: 'auto', halign: 'left' }, 1: { cellWidth: 25, halign: 'center' }, 2: { cellWidth: 35, halign: 'center' } },
            styles: { fontSize: 10, cellPadding: 3, lineColor: [0, 0, 0], lineWidth: 0.2, minCellHeight: 7 },
            margin: { left: 15, right: 15 }
        });
        return doc.lastAutoTable.finalY + 8;
    }

    function addSectionB(doc, data, yPosition) {
        doc.setFontSize(11.5);
        doc.text("SEKSYEN B : REKOD KES KEMALANGAN", 15, yPosition);
        yPosition += 6;
        var sectionB = [
            ["1. Kes Kemalangan Major (Cuti Sakit >= 5 Hari)", "", ""],
            ["1.1 Kes Kematian", data.deathCases, data.deathCasesYTD],
            ["1.2 Kes Kemalangan Parah (Cuti Sakit >= 5 Hari)", data.severeAccidents, data.severeAccidentsYTD],
            ["2. Kes Kemalangan Minor (Cuti Sakit < 5 Hari)", "", ""],
            ["2.1 Kes Rawatan Perubatan", data.medicalCases, data.medicalCasesYTD],
            ["2.2 Kes Rawatan Kecil (First Aid)", data.firstAidCases, data.firstAidCasesYTD],
            ["3. Kes Kemalangan Tiada Kecederaan", "", ""],
            ["3.1 Kebakaran", data.fireCases, data.fireCasesYTD],
            ["3.2 Kerosakan Harta Benda", data.propertyDamage, data.propertyDamageYTD],
            ["3.3 Kejadian Hampir (Near Miss)", data.nearMiss, data.nearMissYTD],
            ["3.4 Lain-lain insiden", data.otherIncidents, data.otherIncidentsYTD]
        ];
        doc.autoTable({
            startY: yPosition,
            head: [['PERKARA', 'BILANGAN KES', 'BILANGAN KES TAHUN INI']],
            body: sectionB,
            theme: 'grid',
            headStyles: { fillColor: [13, 59, 44], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10, halign: 'center' },
            columnStyles: { 0: { cellWidth: 'auto', halign: 'left' }, 1: { cellWidth: 25, halign: 'center' }, 2: { cellWidth: 35, halign: 'center' } },
            styles: { fontSize: 9.5, cellPadding: 3, lineColor: [0, 0, 0], lineWidth: 0.2, minCellHeight: 7 },
            margin: { left: 15, right: 15 },
            didParseCell: function (dataCell) {
                if (dataCell.cell.raw === "" && (dataCell.row.index === 0 || dataCell.row.index === 3 || dataCell.row.index === 6)) {
                    dataCell.cell.styles.fillColor = [240, 240, 240];
                    dataCell.cell.styles.fontStyle = 'bold';
                    dataCell.cell.styles.halign = 'left';
                }
            }
        });
        return doc.lastAutoTable.finalY + 8;
    }

    function addSectionC(doc, data, yPosition) {
        doc.setFontSize(11.5);
        doc.text("SEKSYEN C : REKOD KES BERKAITAN KESIHATAN", 15, yPosition);
        yPosition += 6;
        var sectionC = [
            ["1. Kes Penyakit Pekerjaan", data.occupationalDisease, data.occupationalDiseaseYTD],
            ["2. Kes Penyakit Berjangkit", data.infectiousDisease, data.infectiousDiseaseYTD]
        ];
        doc.autoTable({
            startY: yPosition,
            head: [['PERKARA', 'BILANGAN KES', 'BILANGAN KES TAHUN INI']],
            body: sectionC,
            theme: 'grid',
            headStyles: { fillColor: [13, 59, 44], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10, halign: 'center' },
            columnStyles: { 0: { cellWidth: 'auto', halign: 'left' }, 1: { cellWidth: 25, halign: 'center' }, 2: { cellWidth: 35, halign: 'center' } },
            styles: { fontSize: 10, cellPadding: 3, lineColor: [0, 0, 0], lineWidth: 0.2, minCellHeight: 7 },
            margin: { left: 15, right: 15 }
        });
        return doc.lastAutoTable.finalY + 8;
    }

    function addSectionD(doc, data, yPosition) {
        doc.setFontSize(11.5);
        doc.text("SEKSYEN D : PROGRAM KKP", 15, yPosition);
        yPosition += 6;
        var sectionD = [
            ["1. Jumlah Mesyuarat KKP", data.meetings, data.meetingsYTD],
            ["2. Jumlah Latihan KKP", data.trainings, data.trainingsYTD],
            ["3. Jumlah Taklimat/Toolbox", data.briefings, data.briefingsYTD],
            ["4. Jumlah Pemeriksaan KKP (Pemeriksaan Dalaman & Luaran)", data.inspections, data.inspectionsYTD],
            ["5. Pelaporan Unsafe Act Unsafe Condition (UAUC)", data.uauc, data.uaucYTD],
            ["6. Lain-lain (Contohnya, Kempen atau Promosi Berkaitan KKP)", data.otherActivities, data.otherActivitiesYTD]
        ];
        doc.autoTable({
            startY: yPosition,
            head: [['PERKARA', 'BILANGAN', 'BILANGAN TAHUN INI']],
            body: sectionD,
            theme: 'grid',
            headStyles: { fillColor: [13, 59, 44], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10, halign: 'center' },
            columnStyles: { 0: { cellWidth: 'auto', halign: 'left' }, 1: { cellWidth: 25, halign: 'center' }, 2: { cellWidth: 35, halign: 'center' } },
            styles: { fontSize: 9.5, cellPadding: 3, lineColor: [0, 0, 0], lineWidth: 0.2, minCellHeight: 7 },
            margin: { left: 15, right: 15 }
        });
        return doc.lastAutoTable.finalY + 8;
    }

    function addSectionE(doc, data, yPosition) {
        doc.setFontSize(11.5);
        doc.text("SEKSYEN E : PERAKUAN", 15, yPosition);
        yPosition += 10;
        doc.setFontSize(10);
        doc.text("Saya dengan ini memperakui bahawa maklumat yang diberikan dalam laporan ini adalah benar dan tepat.", 20, yPosition);
        yPosition += 5;
        doc.text("Nama Pegawai yang Melengkapkan:", 20, yPosition);
        doc.text(data.certifierName || '', 79, yPosition);
        yPosition += 15;
        return yPosition;
    }

    function generatePdfFromReport(report) {
        var jsPDF = global.jsPDF || (global.jspdf && global.jspdf.jsPDF);
        if (!jsPDF) throw new Error('jsPDF not loaded');
        var doc = new jsPDF();
        var dateStr = report.reportDate ? new Date(report.reportDate).toLocaleDateString('ms-MY') : '';
        var yPosition = 15;
        addLogoToPdf(doc);
        yPosition = addDocumentTitle(doc, yPosition);
        yPosition = addDivisionInfo(doc, report, dateStr, yPosition);
        yPosition = addSectionA(doc, report, yPosition);
        yPosition = addSectionB(doc, report, yPosition);
        if (yPosition > 150) {
            doc.addPage();
            yPosition = 15;
        }
        yPosition = addSectionC(doc, report, yPosition);
        yPosition = addSectionD(doc, report, yPosition);
        if (yPosition > 180) {
            doc.addPage();
            yPosition = 15;
        }
        yPosition = addSectionE(doc, report, yPosition);
        // Images are shown in the lightbox only, not in the PDF
        return doc;
    }

    global.safeGetValue = safeGetValue;
    global.generatePdfFromReport = generatePdfFromReport;
})(typeof window !== 'undefined' ? window : this);
