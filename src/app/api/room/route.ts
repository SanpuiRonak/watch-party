import { NextRequest, NextResponse } from "next/server";
import { RoomManager } from "@/lib/services/roomManager";
import { CreateRoomRequest } from "@/lib/types";
import { logger } from "@/lib/utils/logger";
import { withErrorHandler } from "@/lib/utils/errorHandler";
import { validateRoomCreationRequest } from "@/lib/middleware/requestValidation";
import { checkRateLimit, createRoomRateLimiter } from "@/lib/middleware/rateLimiter";

const roomManager = new RoomManager();

export const POST = withErrorHandler(async(request: NextRequest) => {
    // Rate limiting - prevent abuse
    const clientIp =
        request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

    try {
        await checkRateLimit(createRoomRateLimiter, clientIp);
    } catch (error) {
        logger.rateLimitEvent(clientIp, "create_room", true);
        return NextResponse.json(
            { error: "Too many room creations. Please try again later." },
            { status: 429 },
        );
    }

    // Parse and validate request body with size limits
    const body: CreateRoomRequest = await request.json();

    // Validate all required fields and their lengths
    const { roomName, streamUrl, ownerId, ownerName } = validateRoomCreationRequest(body);

    const roomId = crypto.randomUUID();

    // Validation and sanitization is handled in roomManager.createRoom()
    const _room = await roomManager.createRoom(roomId, roomName, streamUrl, ownerId, ownerName);

    logger.roomAction("created", roomId, ownerId, { roomName });

    return NextResponse.json({ roomId }, { status: 201 });
}, "POST /api/rooms");
