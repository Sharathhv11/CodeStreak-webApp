import { asyncController } from "../../utils/asyncController.js";

const submissionControll = asyncController(async function (req, res, next) {

    console.log(req.body);
    res.status(201).json({
        success: true,
        message: "Submission received successfully"
    });
});

export default submissionControll;