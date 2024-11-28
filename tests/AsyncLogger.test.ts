// import AsyncLogger from '../src/lib/AsyncLogger';


// class A {
//     logger: AsyncLogger;
//     constructor(logger: AsyncLogger) {
//         this.logger = logger;
//     }}

// class B {
//     logger: AsyncLogger;
//     constructor(logger: AsyncLogger) {
//         this.logger = logger;
//     }
// }

// describe('logger', () => {

//     it('should log a message', async () => {
//         const Ai = new A(new AsyncLogger("A"));
//         const Bi = new B(new AsyncLogger("B"));

//         for (const _class of [Ai, Bi]) {
//             for (const method of ["info", "log", "error", "warn", "debug", "trace"]) {
//                 const consoleMethod = jest.spyOn(global.console, global.console[method].name);
//                 await _class.logger[method](`Hello, world!`);
//                 expect(consoleMethod).toHaveBeenCalled();
//                 consoleMethod.mockReset();
//                 consoleMethod.mockRestore();
//             }
//         }
//     })
// })

describe("logger", () => {
    it("does nothing", () => {
        expect(true).toBe(true);
    })
})