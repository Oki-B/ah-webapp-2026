const { z } = require("zod")

const sessionSchema = {
    revokeDevice: z.object({
        params: z.object({
            sessionId: z.string().uuid({ message: "Invalid Session ID format"})
        })
    })
}