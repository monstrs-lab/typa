export class QueryHandlerAlreadyExistsException extends Error {
  constructor(queryName: string) {
    super(`The query handler for the "${queryName}" query already exists!`)
  }
}
