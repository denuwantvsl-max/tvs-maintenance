/* DEV/TEST ONLY – fake demo data for the local mock and tests. Demo PINs are NOT real PINs. */
(function (G) {
  G.DEMO_DATA = {
    pins: { U01: '0000', U02: '1111', U03: '2222' }, // demo only
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
