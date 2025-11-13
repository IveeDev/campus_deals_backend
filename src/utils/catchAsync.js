// utils/catchAsync.js
export const catchAsync = fn => {
  return (req, res, next) => {
    // Call the async function and catch any rejected Promise
    fn(req, res, next).catch(next);
  };
};
