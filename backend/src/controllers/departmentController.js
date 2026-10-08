const { Op } = require("sequelize");
const { Department } = require("../models");
const { getPagination, paginate } = require("../utils/pagination");
const handleError = require("../utils/handleError");

// GET /api/departments?page=&limit=&search=
const getDepartments = async (req, res) => {
    try {
        const pagination = getPagination(req.query);
        const where = {};

        if (req.query.search) {
            where.name = { [Op.iLike]: `%${req.query.search}%` };
        }

        const { rows, count } = await Department.findAndCountAll({
            where,
            order: [["id", "ASC"]],
            limit: pagination.limit,
            offset: pagination.offset,
        });

        res.json(paginate(rows, count, pagination));
    } catch (error) {
        handleError(res, error, "Failed to get departments");
    }
};

// GET /api/departments/:id
const getDepartmentById = async (req, res) => {
    try {
        const department = await Department.findByPk(req.params.id);

        if (!department) {
            return res.status(404).json({
                message: "Department not found",
            });
        }

        res.json(department);
    } catch (error) {
        handleError(res, error, "Failed to get department");
    }
};

// POST /api/departments
const createDepartment = async (req, res) => {
    try {
        const { name, description } = req.body || {};

        if (!name || !String(name).trim()) {
            return res.status(400).json({
                message: "Department name is required",
            });
        }

        const department = await Department.create({
            name: String(name).trim(),
            description,
        });

        res.status(201).json(department);
    } catch (error) {
        handleError(res, error, "Failed to create department");
    }
};

// PUT /api/departments/:id
const updateDepartment = async (req, res) => {
    try {
        const department = await Department.findByPk(req.params.id);

        if (!department) {
            return res.status(404).json({
                message: "Department not found",
            });
        }

        const { name, description } = req.body || {};

        if (name !== undefined && !String(name).trim()) {
            return res.status(400).json({
                message: "Department name is required",
            });
        }

        await department.update({
            name: name === undefined ? undefined : String(name).trim(),
            description,
        });

        res.json(department);
    } catch (error) {
        handleError(res, error, "Failed to update department");
    }
};

// DELETE /api/departments/:id
const deleteDepartment = async (req, res) => {
    try {
        const department = await Department.findByPk(req.params.id);

        if (!department) {
            return res.status(404).json({
                message: "Department not found",
            });
        }

        await department.destroy();

        res.json({
            message: "Department deleted successfully",
        });
    } catch (error) {
        handleError(res, error, "Failed to delete department");
    }
};

module.exports = {
    getDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment,
};
