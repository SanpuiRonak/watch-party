import { NextRequest, NextResponse } from "next/server";
import { RoomManager } from "@/lib/services/roomManager";

import { logger } from "@/lib/utils/logger";
import { ForbiddenError, NotFoundError, withErrorHandler } from "@/lib/utils/errorHandler";
import { validatePermissionsRequest } from "@/lib/middleware/requestValidation";
import { apiRateLimiter, checkRateLimit } from "@/lib/middleware/rateLimiter";

const roomManager = new RoomManager();

export const PUT = withErrorHandler(
    async(request: NextRequest, { params }: { params: Promise<{ roomId: string }> }) => {
        // Rate limiting - prevent abuse
        const clientIp =
            request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

        try {
            await checkRateLimit(apiRateLimiter, clientIp);
        } catch (error) {
            logger.rateLimitEvent(clientIp, "update_permissions", true);
            return NextResponse.json(
                { error: "Too many requests. Please try again later." },
                { status: 429 },
            );
        }

        const { roomId } = await params;
        const body = await request.json();

        // Validate request body
        const { permissions, ownerId } = validatePermissionsRequest(body);

        // Get room and validate it exists
        const room = await roomManager.getRoom(roomId);
        if (!room) {
            throw new NotFoundError("Room");
        }

        // Verify owner authorization
        if (room.ownerId !== ownerId) {
            logger.warn("Unauthorized permissions update attempt", { roomId, ownerId });
            throw new ForbiddenError("Only room owner can update permissions");
        }

        await roomManager.updatePermissions(roomId, permissions);

        logger.roomAction("updated permissions", roomId, ownerId, { permissions });

        return NextResponse.json({ success: true });
    },
    "PUT /api/rooms/[roomId]/permissions",
);
