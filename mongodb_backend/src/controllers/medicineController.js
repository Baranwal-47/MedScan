const Medicine = require('../models/Medicine');

// Get all medicines with prescription filter
const getMedicines = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const search = req.query.search || '';
    const letter = req.query.letter || '';
    const prescriptionRequired = req.query.prescriptionRequired; // 🆕 NEW FILTER

    const skip = (page - 1) * limit;

    let query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { composition: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by letter
    if (letter) {
      query.letter = letter.toUpperCase();
    }

    // Filter by prescription requirement 🆕
    if (prescriptionRequired !== undefined) {
      query.prescriptionRequired = prescriptionRequired === 'true';
    }

    const medicines = await Medicine.find(query)
      .select('name manufacturer composition price image_url letter prescriptionRequired') // 🆕 Include new field
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 });

    const total = await Medicine.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: medicines,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching medicines',
      error: error.message
    });
  }
};

// Get medicine statistics with prescription info
const getMedicineStats = async (req, res) => {
  try {
    const totalMedicines = await Medicine.countDocuments();
    const prescriptionRequired = await Medicine.countDocuments({ prescriptionRequired: true });
    const otcMedicines = await Medicine.countDocuments({ prescriptionRequired: false });
    
    const letterStats = await Medicine.aggregate([
      {
        $group: {
          _id: '$letter',
          count: { $sum: 1 },
          prescriptionCount: {
            $sum: { $cond: ['$prescriptionRequired', 1, 0] }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalMedicines,
        prescriptionRequired,
        otcMedicines,
        letterStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};

// Other existing methods remain the same...
const getMedicineById = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    res.status(200).json({
      success: true,
      data: medicine
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching medicine details',
      error: error.message
    });
  }
};

module.exports = {
  getMedicines,
  getMedicineById,
  getMedicineStats
};
