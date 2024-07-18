const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Brand = require("../models/brand");
const Product = require("../models/product");

const brandController = {
  getAllBrand: async (req, res) => {
    try {
      let { page, pageSize, brandName, origin } = req.query;
      page = parseInt(page) || 1;
      pageSize = parseInt(pageSize) || 10;

      if (page <= 0) {
        return res.status(400).json({
          message: "Page number must be a positive integer",
          status: 400,
        });
      }

      if (pageSize <= 0) {
        return res.status(400).json({
          message: "Page size must be a positive integer",
          status: 400,
        });
      }

      const skip = (page - 1) * pageSize;
      let query = {};
      if (brandName) {
        query.brandName = { $regex: brandName, $options: "i" };
      }
      if (origin) {
        query.origin = { $regex: origin, $options: "i" };
      }

      const brands = await Brand.find(query).skip(skip).limit(pageSize);
      const totalCount = await Brand.countDocuments(query);

      if (skip >= totalCount) {
        return res.status(404).json({
          message: "Not found brand",
          status: 404,
        });
      }

      return res.status(200).json({
        brands,
        currentPage: page,
        totalPages: Math.ceil(totalCount / pageSize),
        totalbrands: totalCount,
      });
    } catch (err) {
      return res.status(400).json(err);
    }
  },

  getDetailBrand: async (req, res) => {
    try {
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          message: "Invalid brand ID",
          status: 400,
        });
      }

      const brandInfo = await Brand.findById(req.params.id);
      if (!brandInfo) {
        return res.status(404).json({
          message: "Not found brand",
          status: 404,
        });
      }

      return res.status(200).json({ brandInfo });
    } catch (err) {
      return res.status(400).json(err);
    }
  },

  addNewBrand: async (req, res) => {
    const { brandName, origin } = req.body;
    try {
      if (!brandName || !origin) {
        return res.status(400).json({
          message: "Input must be required",
          status: 400,
        });
      }

      const newBrand = await Brand.create(req.body);
      return res.status(200).json({
        message: "Add new brand successful",
        status: 200,
        newBrand,
      });
    } catch (err) {
      return res.status(400).json(err);
    }
  },

  deleteBrand: async (req, res) => {
    try {
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          message: "Invalid brand ID",
          status: 400,
        });
      }

      const brandInProduct = await Product.findOne({
        brand: req.params.id,
      });

      if (brandInProduct) {
        return res.status(400).json({
          message: "Cannot delete brand. It still exist in product",
          status: 400,
        });
      }

      const brand = await Brand.findByIdAndDelete(req.params.id);
      if (!brand) {
        return res.status(404).json({
          message: "Not found brand",
          status: 404,
        });
      }

      return res.status(200).json({
        message: "Delete Successful",
        status: 200,
      });
    } catch (err) {
      return res.status(400).json(err);
    }
  },

  updateBrand: async (req, res) => {
    const { brandName, origin } = req.body;

    try {
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          message: "Invalid brand ID",
          status: 400,
        });
      }

      if (!brandName || !origin) {
        return res.status(400).json({
          message: "Input must be required",
          status: 400,
        });
      }

      const brand = await Brand.findByIdAndUpdate(
        req.params.id,
        {
          brandName,
          origin,
        },
        { new: true }
      );
      if (brand) {
        return res.status(200).json({
          message: "Update Successful",
          status: 200,
        });
      }
    } catch (err) {
      return res.status(400).json(err);
    }
  },
};

module.exports = brandController;
