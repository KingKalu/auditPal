import { Request, Response, NextFunction } from "express";

export const addPartitionFlag = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const originalSetHeader = res.setHeader.bind(res);

  res.setHeader = (name: string, value: any) => {
    if (name.toLowerCase() === "set-cookie") {
      const cookies: string[] = Array.isArray(value)
        ? value.filter((v): v is string => typeof v === "string")
        : typeof value === "string"
        ? [value]
        : [];

      const updatedCookies = cookies.map((cookie) =>
        cookie.includes("Partitioned") ? cookie : `${cookie}; Partitioned`
      );

      console.log("🍪 Updated Set-Cookie:", updatedCookies);
      return originalSetHeader(name, updatedCookies);
    }

    return originalSetHeader(name, value);
  };

  next();
};
