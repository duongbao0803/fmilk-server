const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Brand = require("../models/brand");
const Product = require("../models/product");
const { getAsync, setexAsync } = require("../config/redis");

const brandController = {
  getAllBrand: async (req, res) => {
    try {
      let { page, pageSize, brandName, origin } = req.query;
      page = parseInt(page) || 1;
      pageSize = parseInt(pageSize) || 10;

      if (page <= 0 || pageSize <= 0) {
        return res.status(400).json({
          message: "Số lượng trang và phần tử phải là số dương",
          status: 400,
        });
      }

      const skip = (page - 1) * pageSize;

      let query = {};
      if (brandName) {
        query.brandName = { $regex: new RegExp(brandName, "i") };
      }
      if (origin) {
        query.origin = { $regex: new RegExp(origin, "i") };
      }

      const key = `brands:page:${page}:size:${pageSize}:brandName:${
        brandName || ""
      }:origin:${origin || ""}`;

      try {
        const cachedData = await getAsync(key);
        if (cachedData) {
          return res.status(200).json(JSON.parse(cachedData));
        }

        const brands = await Brand.find(query).skip(skip).limit(pageSize);
        const totalCount = await Brand.countDocuments(query);

        if (totalCount === 0) {
          return res.status(404).json({
            message: "Không tìm thấy thương hiệu",
            status: 404,
          });
        }

        const response = {
          brands,
          currentPage: page,
          totalPages: Math.ceil(totalCount / pageSize),
          totalBrands: totalCount,
        };

        await setexAsync(key, 1500, JSON.stringify(response));

        return res.status(200).json(response);
      } catch (err) {
        return res.status(400).json(err);
      }
    } catch (err) {
      return res.status(400).json(err);
    }
  },

  getDetailBrand: async (req, res) => {
    try {
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          message: "ID của thương hiệu không hợp lệ",
          status: 400,
        });
      }

      const brandInfo = await Brand.findById(req.params.id);
      if (!brandInfo) {
        return res.status(404).json({
          message: "Không tìm thấy thương hiệu",
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
          message: "Mọi trường dữ liệu đều bắt buộc",
          status: 400,
        });
      }

      const newBrand = await Brand.create(req.body);
      return res.status(200).json({
        message: "Thêm thương hiệu mới thành công",
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
          message: "ID của thương hiệu không hợp lệ",
          status: 400,
        });
      }

      const brandInProduct = await Product.findOne({
        brand: req.params.id,
      });

      if (brandInProduct) {
        return res.status(400).json({
          message:
            "Không thể xóa thương hiệu. Thương hiệu vẫn còn tồn tại trong sản phẩm",
          status: 400,
        });
      }

      const brand = await Brand.findByIdAndDelete(req.params.id);
      if (!brand) {
        return res.status(404).json({
          message: "Không tìm thấy thương hiệu",
          status: 404,
        });
      }

      return res.status(200).json({
        message: "Xóa thành công",
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
          message: "ID của thương hiệu không hợp lệ",
          status: 400,
        });
      }

      if (!brandName || !origin) {
        return res.status(400).json({
          message: "Mọi trường dữ liệu đều bắt buộc",
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
          message: "Cập nhật thành công",
          status: 200,
        });
      }
    } catch (err) {
      return res.status(400).json(err);
    }
  },
};

module.exports = brandController;
