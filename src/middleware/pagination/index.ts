import { NextFunction } from "express";

export const pagination = (req: any, res: any, next: NextFunction) => {
    
    try {
        const page = req.query.page || 1;
        const limit = req.query.limit || 10;
        const skip = (page - 1) * limit;

        const paginationParams = {
            page,
            limit,
            skip
        }

        req.pagination = paginationParams;
        next()
    } catch (error) {
        res.status(404).send({
            error: error
        })
    }
    
    

}