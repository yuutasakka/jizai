import tracer from '../utils/tracer.mjs';

export function tracingMiddleware() {
  return (req, res, next) => {
    const requestId = req.id || res.locals.requestId;
    const span = tracer.startSpan('http.request', {
      method: req.method,
      path: req.originalUrl || req.url,
      requestId
    });
    const done = (err = null) => {
      res.removeListener('finish', finishHandler);
      res.removeListener('close', closeHandler);
      span.end(err, { status: res.statusCode });
    };
    const finishHandler = () => done();
    const closeHandler = () => done(new Error('connection closed'));
    res.on('finish', finishHandler);
    res.on('close', closeHandler);
    next();
  };
}

export default tracingMiddleware;

