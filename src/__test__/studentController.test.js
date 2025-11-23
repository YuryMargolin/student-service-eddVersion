// Интеграционные тесты контроллера с использованием supertest и ESM-моков сервиса
import { jest, describe, test, expect, beforeAll, beforeEach } from "@jest/globals";
import express from "express";
import request from "supertest";

// Создаем мок для сервиса до импорта контроллера
const serviceMock = {
  addStudent: jest.fn(),
  findStudent: jest.fn(),
  deleteStudent: jest.fn(),
  updateStudent: jest.fn(),
  addScore: jest.fn(),
  findByName: jest.fn(),
  countByNames: jest.fn(),
  findByMinScore: jest.fn(),
};

jest.unstable_mockModule("../service/studentService.js", () => ({
  ...serviceMock,
}));

// Динамически импортируем контроллер после мокинга сервиса
const controller = await import("../controller/studentController.js");

// Собираем express-приложение и регистрируем такие же роуты, как в приложении
let app;
beforeAll(() => {
  app = express();
  app.use(express.json());

  // Маршруты соответствуют src/routes/studentRoutes.js
  app.post("/student", controller.addStudent);
  app.get("/student/:id", controller.findStudent);
  app.delete("/student/:id", controller.deleteStudent);
  app.patch("/student/:id", controller.updateStudent);
  app.patch("/score/student/:id", controller.addScore);
  app.get("/students/name/:name", controller.findByName);
  app.get("/quantity/students", controller.countByNames);
  app.get("/students/exam/:exam/minscore/:minScore", controller.findByMinScore);
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("studentController", () => {
  describe("POST /student (addStudent)", () => {
    test("201 Created, когда сервис вернул true", async () => {
      serviceMock.addStudent.mockResolvedValueOnce(true);

      await request(app)
        .post("/student")
        .send({ id: 1, name: "Ann", password: "p" })
        .expect(201);

      expect(serviceMock.addStudent).toHaveBeenCalledWith({ id: 1, name: "Ann", password: "p" });
    });

    test("409 Conflict, когда сервис вернул false (id занят)", async () => {
      serviceMock.addStudent.mockResolvedValueOnce(false);

      await request(app)
        .post("/student")
        .send({ id: 1, name: "Ann", password: "p" })
        .expect(409);
    });

    test("400 Bad Request при невалидном теле", async () => {
      // отсутствует password
      await request(app)
        .post("/student")
        .send({ id: 1, name: "Ann" })
        .expect(400)
        .expect("Content-Type", /json/);

      expect(serviceMock.addStudent).not.toHaveBeenCalled();
    });
  });

  describe("GET /student/:id (findStudent)", () => {
    test("200 OK и тело студента при найденном", async () => {
      serviceMock.findStudent.mockResolvedValueOnce({ _id: 10, name: "Ira" });

      const res = await request(app).get("/student/10").expect(200);
      expect(res.body).toEqual({ _id: 10, name: "Ira" });
      expect(serviceMock.findStudent).toHaveBeenCalledWith(10);
    });

    test("404 Not Found при отсутствии студента", async () => {
      serviceMock.findStudent.mockResolvedValueOnce(null);
      await request(app).get("/student/404").expect(404);
    });
  });

  describe("PATCH /student/:id (updateStudent)", () => {
    test("200 OK с обновленным студентом", async () => {
      serviceMock.updateStudent.mockResolvedValueOnce({ _id: 5, name: "Ada" });

      const res = await request(app)
        .patch("/student/5")
        .send({ name: "Ada L." })
        .expect(200);
      expect(res.body).toEqual({ _id: 5, name: "Ada" });
      expect(serviceMock.updateStudent).toHaveBeenCalledWith(5, { name: "Ada L." });
    });

    test("404 Not Found, если сервис не нашел студента", async () => {
      serviceMock.updateStudent.mockResolvedValueOnce(null);
      await request(app).patch("/student/777").send({ name: "Nope" }).expect(404);
    });

    test("400 Bad Request при невалидном теле", async () => {
      // тело пустое и не содержит валидных полей
      await request(app).patch("/student/1").send({ unknown: true }).expect(400);
      expect(serviceMock.updateStudent).not.toHaveBeenCalled();
    });
  });

  describe("DELETE /student/:id (deleteStudent)", () => {
    test("200 OK с удаленным студентом", async () => {
      serviceMock.deleteStudent.mockResolvedValueOnce({ _id: 3, name: "Max" });
      const res = await request(app).delete("/student/3").expect(200);
      expect(res.body).toEqual({ _id: 3, name: "Max" });
      expect(serviceMock.deleteStudent).toHaveBeenCalledWith(3);
    });

    test("404 Not Found если студента нет", async () => {
      serviceMock.deleteStudent.mockResolvedValueOnce(null);
      await request(app).delete("/student/999").expect(404);
    });
  });

  describe("PATCH /score/student/:id (addScore)", () => {
    test("204 No Content при успешном добавлении оценки", async () => {
      serviceMock.addScore.mockResolvedValueOnce(true);
      await request(app)
        .patch("/score/student/1")
        .send({ examName: "math", score: 90 })
        .expect(204);
      expect(serviceMock.addScore).toHaveBeenCalledWith(1, "math", 90);
    });

    test("404 Not Found если сервис вернул false", async () => {
      serviceMock.addScore.mockResolvedValueOnce(false);
      await request(app)
        .patch("/score/student/1")
        .send({ examName: "math", score: 90 })
        .expect(404);
    });

    test("400 Bad Request при невалидном теле", async () => {
      await request(app)
        .patch("/score/student/1")
        .send({ examName: "math" }) // нет score
        .expect(400)
        .expect("Content-Type", /json/);
      expect(serviceMock.addScore).not.toHaveBeenCalled();
    });
  });

  describe("GET /students/name/:name (findByName)", () => {
    test("200 OK и массив студентов", async () => {
      const list = [
        { _id: 1, name: "Ann" },
        { _id: 2, name: "Ann" },
      ];
      serviceMock.findByName.mockResolvedValueOnce(list);

      const res = await request(app).get("/students/name/Ann").expect(200);
      expect(res.body).toEqual(list);
      expect(serviceMock.findByName).toHaveBeenCalledWith("Ann");
    });
  });

  describe("GET /quantity/students (countByNames)", () => {
    test("200 OK и число при одном имени в query", async () => {
      serviceMock.countByNames.mockResolvedValueOnce(1);
      const res = await request(app).get("/quantity/students?names=Ann").expect(200);
      expect(res.body).toBe(1);
      expect(serviceMock.countByNames).toHaveBeenCalledWith(["Ann"]);
    });

    test("200 OK и число при массиве имен в query", async () => {
      serviceMock.countByNames.mockResolvedValueOnce(3);
      const res = await request(app)
        .get("/quantity/students?names=Ann&names=Bob&names=Tom")
        .expect(200);
      expect(res.body).toBe(3);
      expect(serviceMock.countByNames).toHaveBeenCalledWith(["Ann", "Bob", "Tom"]);
    });
  });

  describe("GET /students/exam/:exam/minscore/:minScore (findByMinScore)", () => {
    test("200 OK и массив студентов", async () => {
      const list = [{ _id: 1, name: "Tom", scores: { math: 95 } }];
      serviceMock.findByMinScore.mockResolvedValueOnce(list);
      const res = await request(app).get("/students/exam/math/minscore/90").expect(200);
      expect(res.body).toEqual(list);
      expect(serviceMock.findByMinScore).toHaveBeenCalledWith("math", 90);
    });
  });
});