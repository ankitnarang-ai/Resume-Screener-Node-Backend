import { log } from "console";
import { Hr } from "../../models/hr";

export const resumeAnalytics = async (req: any, res: any) => {
  try {
    const hrId = req.user?._id;

    if (!hrId) {
      throw new Error("HR ID is not provided in the request");
    }

    const hr = await Hr.findOne({ _user: hrId });

    if (!hr) {
      throw new Error("HR user not found");
    }

    res.status(200).json({
      status: "success",
      data: hr
    });

  } catch (error: any) {
    res.status(400).json({
      status: "error",
      message: error.message || "An error occurred while fetching HR data"
    });
  }

}