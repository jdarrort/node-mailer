class MyAppError extends Error {
    constructor(code, msg){
        super();
        this.name =  "MyAppError";
        this.code = code;
        this.message = msg;
        //if (this.stack) { console.error(this.stack)}
    }
}

var ERROR = {}
ERROR.NotFoundError = function(msg) { return new MyAppError(404,msg)}
ERROR.InvalidAttr = function(msg) { return new MyAppError(400,msg)}
ERROR.ServerException = function(msg) { return new MyAppError(500,msg)}
ERROR.UnhandledException = function(msg) { return new MyAppError(500,msg)}
ERROR.NotAuthorized = function(msg) { return new MyAppError(403,msg)}
ERROR.NotAuthenticated = function(msg) { return new MyAppError(401,msg)}
ERROR.TodoError = function(msg) { return new MyAppError(404,msg)}
ERROR.isMyAppError = function( err ) { return (err instanceof MyAppError) }

//==========================================
module.exports =  ERROR;
//==========================================
