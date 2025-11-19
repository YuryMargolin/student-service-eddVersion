// The Arrange, Act, Assert (AAA) pattern in unit tests
// Tests for studentService.js using ESM and repository mocks
import { jest, describe, test, expect, beforeEach } from "@jest/globals";

// Create ESM mock of repository exports
const repoMock = {
  findStudentById: jest.fn(),
  createStudent: jest.fn(),
  deleteStudentById: jest.fn(),
  updateStudent: jest.fn(),
  updateStudentScores: jest.fn(),
  findStudentsByName: jest.fn(),
  countStudentsByName: jest.fn(),
  findStudentsByMinScore: jest.fn(),
};

// Mock repository module BEFORE importing the service
jest.unstable_mockModule("../repository/studentRepository.js", () => ({
  ...repoMock,
}));

// Dynamic import of the service after mocking
const service = await import("../service/studentService.js");

describe("studentService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("addStudent", () => {
    test("returns false if a student with this id already exists", async () => {
      repoMock.findStudentById.mockResolvedValueOnce({ _id: "1" });

      const result = await service.addStudent({ id: "1", name: "Ann", password: "p" });

      expect(result).toBe(false);
      expect(repoMock.createStudent).not.toHaveBeenCalled();
      expect(repoMock.findStudentById).toHaveBeenCalledWith("1");
    });

    test("creates a student and returns true if the id is available", async () => {
      repoMock.findStudentById.mockResolvedValueOnce(null);
      repoMock.createStudent.mockResolvedValueOnce({ _id: "2" });

      const result = await service.addStudent({ id: "2", name: "Bob", password: "secret" });

      expect(result).toBe(true);
      expect(repoMock.findStudentById).toHaveBeenCalledWith("2");
      expect(repoMock.createStudent).toHaveBeenCalledWith({ _id: "2", name: "Bob", password: "secret" });
    });
  });

  describe("findStudent", () => {
    test("clears password in the found student", async () => {
      const dbStudent = { _id: "10", name: "Ira", password: "hash" };
      repoMock.findStudentById.mockResolvedValueOnce({ ...dbStudent });

      const result = await service.findStudent("10");

      expect(repoMock.findStudentById).toHaveBeenCalledWith("10");
      expect(result).toEqual({ _id: "10", name: "Ira", password: undefined });
    });

    test("returns null/undefined as is if the student is not found", async () => {
      repoMock.findStudentById.mockResolvedValueOnce(null);
      const result = await service.findStudent("404");
      expect(result).toBeNull();
    });
  });

  describe("deleteStudent", () => {
    test("returns the deleted student with password cleared", async () => {
      repoMock.deleteStudentById.mockResolvedValueOnce({ _id: "3", name: "Max", password: "hash" });

      const deleted = await service.deleteStudent("3");

      expect(repoMock.deleteStudentById).toHaveBeenCalledWith("3");
      expect(deleted).toEqual({ _id: "3", name: "Max", password: undefined });
    });

    test("returns null if such a student does not exist", async () => {
      repoMock.deleteStudentById.mockResolvedValueOnce(null);
      const deleted = await service.deleteStudent("-1");
      expect(deleted).toBeNull();
    });
  });

  describe("updateStudent", () => {
    test("clears scores in the response", async () => {
      repoMock.updateStudent.mockResolvedValueOnce({ _id: "5", name: "Ada", scores: { math: 100 } });

      const updated = await service.updateStudent("5", { name: "Ada L." });

      expect(repoMock.updateStudent).toHaveBeenCalledWith("5", { name: "Ada L." });
      expect(updated).toEqual({ _id: "5", name: "Ada", scores: undefined });
    });

    test("returns null if the update didn't find a student", async () => {
      repoMock.updateStudent.mockResolvedValueOnce(null);
      const updated = await service.updateStudent("777", { name: "Nope" });
      expect(updated).toBeNull();
    });
  });

  describe("addScore", () => {
    test("delegates to repository", async () => {
      repoMock.updateStudentScores.mockResolvedValueOnce({ ok: true });
      const res = await service.addScore("1", "math", 90);
      expect(repoMock.updateStudentScores).toHaveBeenCalledWith("1", "math", 90);
      expect(res).toEqual({ ok: true });
    });
  });

  describe("findByName", () => {
    test("clears password for each found student", async () => {
      repoMock.findStudentsByName.mockResolvedValueOnce([
        { _id: "1", name: "Ann", password: "h1" },
        { _id: "2", name: "Ann", password: "h2" },
      ]);

      const list = await service.findByName("Ann");

      expect(repoMock.findStudentsByName).toHaveBeenCalledWith("Ann");
      expect(list).toEqual([
        { _id: "1", name: "Ann", password: undefined },
        { _id: "2", name: "Ann", password: undefined },
      ]);
    });
  });

  describe("countByNames", () => {
    test("returns the number from the repository", async () => {
      repoMock.countStudentsByName.mockResolvedValueOnce(3);
      const count = await service.countByNames(["Ann", "Bob"]);
      expect(repoMock.countStudentsByName).toHaveBeenCalledWith(["Ann", "Bob"]);
      expect(count).toBe(3);
    });
  });

  describe("findByMinScore", () => {
    test("clears passwords in the list of students", async () => {
      repoMock.findStudentsByMinScore.mockResolvedValueOnce([
        { _id: "1", name: "Tom", password: "h", scores: { math: 95 } },
      ]);

      const list = await service.findByMinScore("math", 90);

      expect(repoMock.findStudentsByMinScore).toHaveBeenCalledWith("math", 90);
      expect(list).toEqual([{ _id: "1", name: "Tom", password: undefined, scores: { math: 95 } }]);
    });
  });
});
