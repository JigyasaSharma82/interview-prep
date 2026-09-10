export class GenerationError extends Error {
  constructor(stage, message, options = {}) {
    super(message, options);
    this.name = "GenerationError";
    this.code = "GENERATION_FAILED";
    this.stage = stage;
  }
}
