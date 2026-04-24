const BaseRepository = require("../../../src/repositories/base.repository");

describe("BaseRepository Unit Test", () => {
  let mockModel;
  let repository;

  beforeEach(() => {
    // 1. Buat Mock Model dengan method-method Sequelize
    mockModel = {
      findOne: jest.fn(),
      findByPk: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
    };

    // 2. Inisialisasi repository dengan mock model
    repository = new BaseRepository(mockModel);
    jest.clearAllMocks();
  });

  describe("findOne()", () => {
    it("should call model.findOne with correct options", async () => {
      const options = { where: { email: "test@me.com" } };
      await repository.findOne(options);

      expect(mockModel.findOne).toHaveBeenCalledWith(options);
    });
  });

  describe("findById()", () => {
    it("should call model.findByPk with correct ID", async () => {
      const id = 123;
      await repository.findById(id);

      expect(mockModel.findByPk).toHaveBeenCalledWith(id, {});
    });
  });

  describe("create()", () => {
    it("should call model.create with data and options", async () => {
      const data = { name: "New Data" };
      const options = { transaction: {} };
      await repository.create(data, options);

      expect(mockModel.create).toHaveBeenCalledWith(data, options);
    });
  });

  describe("update()", () => {
    it("should throw error if where clause is missing", async () => {
      const data = { name: "Updated" };
      
      await expect(repository.update(data, {}))
        .rejects.toThrow("Update operation requires a where clause.");
      
      expect(mockModel.update).not.toHaveBeenCalled();
    });

    it("should call model.update if where clause is present", async () => {
      const data = { name: "Updated" };
      const options = { where: { id: 1 } };
      
      await repository.update(data, options);
      
      expect(mockModel.update).toHaveBeenCalledWith(data, options);
    });
  });

  describe("delete()", () => {
    it("should throw error if where clause is missing", async () => {
      await expect(repository.delete({}))
        .rejects.toThrow("Delete operation requires a where clause.");
      
      expect(mockModel.destroy).not.toHaveBeenCalled();
    });

    it("should call model.destroy if where clause is present", async () => {
      const options = { where: { id: 1 } };
      
      await repository.delete(options);
      
      expect(mockModel.destroy).toHaveBeenCalledWith(options);
    });
  });
});