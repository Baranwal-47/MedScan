const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: process.env.MONGO_DB_NAME || 'prescription-medicine',
    });
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const updateMedicines = async () => {
  try {
    await connectDB();
    
    // Update all existing medicines that don't have prescriptionRequired field
    const result = await mongoose.connection.db.collection('medicines').updateMany(
      { prescriptionRequired: { $exists: false } }, // Only update documents without this field
      { $set: { prescriptionRequired: false } }     // Set default value to false
    );
    
    console.log(`Updated ${result.modifiedCount} medicines with prescriptionRequired field`);
    
    // List of prescription-required drug compositions
    const prescriptionDrugs = [
      'Metformin',       // Diabetes medication
      'Paclitaxel',      // Chemotherapy drug
      'Ramipril',        // ACE inhibitor for hypertension
      'Atorvastatin',    // Cholesterol medication
      'Omeprazole',      // Proton pump inhibitor
      'Warfarin',        // Blood thinner
      'Insulin',         // Diabetes medication
      'Morphine',        // Opioid pain medication
      'Diazepam',        // Benzodiazepine
      'Tramadol',        // Pain medication
      'Codeine',         // Opioid cough suppressant
      'Prednisolone',    // Corticosteroid
      'Levothyroxine',   // Thyroid medication
      'Lisinopril',      // ACE inhibitor
      'Amlodipine',      // Calcium channel blocker
      'Furosemide',      // Diuretic
      'Gabapentin'       // Anticonvulsant/pain medication
    ];
    
    // Create regex pattern that matches any of these drugs in composition
    const prescriptionPattern = new RegExp(prescriptionDrugs.join('|'), 'i');
    
    // Update medicines with prescription-required compositions
    const compositionResult = await mongoose.connection.db.collection('medicines').updateMany(
      { 
        composition: { $regex: prescriptionPattern },
        prescriptionRequired: false 
      },
      { $set: { prescriptionRequired: true } }
    );
    
    console.log(`✅ Updated ${compositionResult.modifiedCount} medicines to require prescription based on composition`);
    
    // Update medicines containing "Injection" in name to require prescription
    const injectionResult = await mongoose.connection.db.collection('medicines').updateMany(
      { 
        name: { $regex: /injection|tablet.*mg/i },
        prescriptionRequired: false 
      },
      { $set: { prescriptionRequired: true } }
    );
    
    console.log(`✅ Updated ${injectionResult.modifiedCount} medicines to require prescription based on name`);
    
    // Update specific high-risk categories
    const highRiskCategories = [
      'antibiotic',
      'chemotherapy',
      'opioid',
      'benzodiazepine',
      'insulin',
      'steroid',
      'antipsychotic',
      'antidepressant',
      'immunosuppressant'
    ];
    
    const categoryPattern = new RegExp(highRiskCategories.join('|'), 'i');
    
    const categoryResult = await mongoose.connection.db.collection('medicines').updateMany(
      { 
        $or: [
          { composition: { $regex: categoryPattern } },
          { description: { $regex: categoryPattern } },
          { uses: { $regex: categoryPattern } }
        ],
        prescriptionRequired: false 
      },
      { $set: { prescriptionRequired: true } }
    );
    
    console.log(`✅ Updated ${categoryResult.modifiedCount} medicines to require prescription based on drug category`);
    
    // Log final statistics
    const totalPrescriptionRequired = await mongoose.connection.db.collection('medicines').countDocuments({
      prescriptionRequired: true
    });
    
    const totalOTC = await mongoose.connection.db.collection('medicines').countDocuments({
      prescriptionRequired: false
    });
    
    console.log('Final Statistics:');
    console.log(`   Prescription Required: ${totalPrescriptionRequired} medicines`);
    console.log(`   Over-the-Counter: ${totalOTC} medicines`);
    console.log(`   Total: ${totalPrescriptionRequired + totalOTC} medicines`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

updateMedicines();
