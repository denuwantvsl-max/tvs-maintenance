/* DEV/TEST ONLY – fake demo data for the local mock and tests. Demo PINs are NOT real PINs. */
(function (G) {
  G.DEMO_DATA = {
    pins: { U01: '0000', U02: '1111', U03: '2222' }, // demo only
    // [TemplateID, Title, DocNo, ItemNo, Section, Text, TextSi, Type, Unit, Min, Max, Frequency, PerChild]
    checklist: [
      ['CL-29', 'Compressor check list', 'TVS/QMS/CL/29', 1, 'Daily checks', 'Compressor hour reading', '', 'number', 'h', '', '', 'Daily', ''],
      ['CL-29', 'Compressor check list', 'TVS/QMS/CL/29', 2, 'Daily checks', 'Check oil level', 'තෙල් මට්ටම පරීක්ෂා කරන්න', 'check', '', '', '', 'Daily', ''],
      ['CL-29', 'Compressor check list', 'TVS/QMS/CL/29', 3, 'Daily checks', 'Readings on display normal', '', 'check', '', '', '', 'Daily', ''],
      ['CL-29', 'Compressor check list', 'TVS/QMS/CL/29', 4, 'Daily checks', 'Working pressure', '', 'number', 'bar', 6, 10, 'Daily', ''],
      ['CL-29', 'Compressor check list', 'TVS/QMS/CL/29', 5, 'Weekly / monthly', 'Clean air dryer outer body', '', 'check', '', '', '', 'Weekly', ''],
      ['CL-29', 'Compressor check list', 'TVS/QMS/CL/29', 6, 'Weekly / monthly', 'Inspect dryer condenser, clean if needed', '', 'check', '', '', '', 'Monthly', ''],
      ['CL-32', 'Assembly line tools check list', 'TVS/QMS/CL/32', 1, '', 'Tool condition', '', 'check', '', '', '', 'Monthly', 'Yes'],
      ['CL-32', 'Assembly line tools check list', 'TVS/QMS/CL/32', 2, '', 'Free of noise', '', 'check', '', '', '', 'Monthly', 'Yes'],
      ['CL-32', 'Assembly line tools check list', 'TVS/QMS/CL/32', 3, '', 'Oil applied', '', 'check', '', '', '', 'Monthly', 'Yes']
    ],
    tasks: [
      { TaskID: 'T0001', AssetID: 'EN-CA-01', Title: 'Compressor daily check', TemplateID: 'CL-29', Scope: 'Daily', FreqUnit: 'Day', FreqValue: 1, AssignedTo: 'U03', DoneBy: 'Internal', Active: 'Yes', due: 0 },
      { TaskID: 'T0002', AssetID: 'EN-CA-01', Title: 'Compressor monthly check', TemplateID: 'CL-29', Scope: 'Monthly', FreqUnit: 'Month', FreqValue: 1, DoneBy: 'Internal', Active: 'Yes', due: -4 },
      { TaskID: 'T0003', AssetID: 'EN-CA-01', Title: 'Compressor service (contractor)', FreqUnit: 'Month', FreqValue: 3, MeterInterval: 2000, LastMeter: 1000, DoneBy: 'Swedish Trading Co. (Pvt) Ltd', Active: 'Yes', due: 40 },
      { TaskID: 'T0004', AssetID: 'PD-AL-02', Title: 'Assembly line tools monthly check', TemplateID: 'CL-32', Scope: 'Monthly', FreqUnit: 'Month', FreqValue: 1, DoneBy: 'Internal', Active: 'Yes', due: 3 },
      { TaskID: 'T0005', AssetID: 'ST-MM-01', Title: 'Forklift 500 h / 6-month service', FreqUnit: 'Month', FreqValue: 6, MeterInterval: 500, DoneBy: 'UTE', Active: 'Yes', due: null }
    ],
    assets: [
      { AssetID: 'PD-AL-01', Name: 'Main assembly conveyor', Area: 'Assembly Line', Location: 'Main assembly line', Category: 'Conveyor', Make: 'ADF Engineering', Criticality: 'A', Status: 'Active', MaintainedBy: 'TVSL', PMFrequency: 'Monthly', ChecklistRef: 'TVS/QMS/CL/31' },
      { AssetID: 'PD-AL-02', Name: 'Assembly line pneumatic tool set', Area: 'Assembly Line', Location: 'Main assembly line', Category: 'Torque tools', Make: 'URYU, Ingersoll Rand', Criticality: 'A', Status: 'Active', MaintainedBy: 'TVSL', PMFrequency: 'Monthly', ChecklistRef: 'TVS/QMS/CL/32' },
      { AssetID: 'QIP08-001', Name: 'Pistol nutrunner IR QIP08Q4', Area: 'Assembly Line', Location: 'L-1 LH', ParentID: 'PD-AL-02', Category: 'Torque tool', Make: 'Ingersoll Rand', Model: 'QIP08Q4', Status: 'Active' },
      { AssetID: 'EN-CA-01', Name: 'Air compressor', Area: 'Compressed Air', Location: 'Compressor room', Category: 'Compressor', Make: 'Atlas Copco', Model: 'G30P A10 OP', SerialNo: 'WUX733743', Year: '2021', Specs: 'Max pressure: 10 bar\nCapacity: 4.49 m³/min\nMotor: 30 kW', Criticality: 'A', Status: 'Active', MaintainedBy: 'Swedish Trading Co.', PMFrequency: '3 months', ChecklistRef: 'TVS/QMS/CL/29', CertRequired: 'Yes', CertExpiry: new Date('2027-06-27T00:00:00+05:30'), CertFileId: '1GM1i94w8He1TJKuaVgBojInBmQmWz6ac' },
      { AssetID: 'ST-MM-01', Name: 'Forklift 2.5 t', Area: 'Material Handling', Location: 'Stores', Category: 'Forklift', Make: 'Caterpillar', Model: 'DP25NT', SerialNo: 'CT18C-87662', Criticality: 'B', Status: 'Active', MaintainedBy: 'UTE', PMFrequency: '500 h or 6 months', ChecklistRef: 'TVS/QMS/CL/34', CertRequired: 'Yes', CertExpiry: new Date(Date.now() + 20 * 86400000) },
      { AssetID: 'EN-PS-06', Name: 'Diesel generator 250 kVA', Area: 'Power Supply', Location: 'Generator room', Category: 'Generator', Make: 'Greaves Cotton', Model: 'GPWII-250E', Criticality: 'A', Status: 'Active', PMFrequency: '400 h or 6 months', ChecklistRef: 'TVS/QMS/CL/28', CertRequired: 'Yes', CertExpiry: new Date(Date.now() - 5 * 86400000) }
    ]
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
