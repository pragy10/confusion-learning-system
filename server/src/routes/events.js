const express = require("express");

const mongoose = require("mongoose");
const Event = require("../models/Event");

const router = express.Router();

const inMemoryEvents = [];


/*
 * Save telemetry event
 */
router.post("/", async (req, res) => {
  try {
    const {
      sessionId,
      type,
      videoTime,
      confusionType,
      reason,
      from,
      to,
      distance,
      previousRate,
      newRate,
      depth,
      explanation,
      visualType,
      visualTitle,
      keyPoint,
      metadata,
      timestamp,
    } = req.body;


    if (!sessionId || !type) {
      return res.status(400).json({
        error:
          "sessionId and type are required.",
      });
    }

    if (mongoose.connection.readyState !== 1) {
      const memoryEvent = {
        _id: String(Date.now() + Math.random()),
        sessionId,
        type,
        videoTime,
        confusionType,
        reason,
        from,
        to,
        distance,
        previousRate,
        newRate,
        depth,
        explanation,
        visualType,
        visualTitle,
        keyPoint,
        metadata,
        clientTimestamp: timestamp || new Date().toISOString()
      };
      inMemoryEvents.push(memoryEvent);
      if (inMemoryEvents.length > 500) inMemoryEvents.shift();
      return res.status(201).json({ success: true, event: memoryEvent, storage: "in_memory" });
    }

    const event = await Event.create({
      sessionId,

      type,

      videoTime,

      confusionType,

      reason,

      from,

      to,

      distance,

      previousRate,

      newRate,

      depth,

      explanation,

      visualType,

      visualTitle,

      keyPoint,

      metadata,

      clientTimestamp: timestamp,
    });


    res.status(201).json({
      success: true,
      event,
    });

  } catch (error) {

    console.error(
      "[EVENT SAVE ERROR]",
      error
    );

    res.status(500).json({
      error:
        "Could not save event.",
    });
  }
});


/*
 * Get events
 *
 * Optional:
 *
 * GET /api/events?sessionId=abc
 *
 * If sessionId is provided, only events
 * from that session are returned.
 */
router.get("/", async (req, res) => {
  try {

    const {
      sessionId,
    } = req.query;


    const filter = sessionId
      ? { sessionId }
      : {};


    const events =
      await Event.find(filter)
        .sort({
          createdAt: 1,
        })
        .lean();


    res.json({
      count: events.length,
      events,
    });

  } catch (error) {

    console.error(
      "[EVENT FETCH ERROR]",
      error
    );

    res.status(500).json({
      error:
        "Could not fetch events.",
    });
  }
});


/*
 * Peer Confusion Heatmap
 *
 * GET:
 *
 * /api/events/heatmap
 *
 * Optional:
 *
 * /api/events/heatmap?sessionId=abc
 *
 * The provided sessionId is excluded from
 * the aggregation so the current learner's
 * own confusion is not displayed as peer data.
 */
router.get(
  "/heatmap",
  async (req, res) => {

    try {

      const {
        sessionId,
      } = req.query;


      /*
       * Only manual confusion signals are used
       * for the first version of the peer
       * confusion heatmap.
       *
       * This keeps the meaning simple:
       *
       * "How many learners explicitly
       * signalled confusion around this point?"
       */
      const filter = {
        type: "CONFUSION_SIGNAL",

        videoTime: {
          $ne: null,
        },
      };


      /*
       * If the frontend provides the current
       * session ID, exclude it.
       *
       * This prevents the current learner's
       * own confusion events from becoming
       * "peer" confusion.
       */
      if (sessionId) {

        filter.sessionId = {
          $ne: sessionId,
        };

      }


      let events = [];
      if (mongoose.connection.readyState === 1) {
        events = await Event.find(filter)
          .select("sessionId videoTime confusionType")
          .lean();
      } else {
        events = inMemoryEvents.filter(e => e.confusionType && (!sessionId || e.sessionId !== sessionId));
      }


      /*
       * 10-second heatmap buckets.
       *
       * Example:
       *
       * 0.0s  -> 10.0s
       * 10.0s -> 20.0s
       * 20.0s -> 30.0s
       */
      const BUCKET_SIZE = 10;


      const buckets = new Map();


      for (const event of events) {

        const videoTime =
          Number(event.videoTime);


        if (
          !Number.isFinite(videoTime) ||
          videoTime < 0
        ) {
          continue;
        }


        const bucketStart =
          Math.floor(
            videoTime / BUCKET_SIZE
          ) * BUCKET_SIZE;


        const bucketEnd =
          bucketStart +
          BUCKET_SIZE;


        const key =
          `${bucketStart}-${bucketEnd}`;


        if (!buckets.has(key)) {

          buckets.set(key, {
            start: bucketStart,

            end: bucketEnd,

            count: 0,

            /*
             * Keep the individual confusion
             * types as supporting information.
             */
            confusionTypes: {},
          });

        }


        const bucket =
          buckets.get(key);


        bucket.count += 1;


        if (event.confusionType) {

          bucket.confusionTypes[
            event.confusionType
          ] =
            (
              bucket.confusionTypes[
                event.confusionType
              ] || 0
            ) + 1;

        }

      }


      /*
       * Convert Map -> array and sort by
       * video position.
       */
      const heatmap =
        Array.from(
          buckets.values()
        ).sort(
          (a, b) =>
            a.start - b.start
        );


      res.json({
        bucketSize: BUCKET_SIZE,

        count: heatmap.length,

        heatmap,
      });

    } catch (error) {

      console.error(
        "[HEATMAP ERROR]",
        error
      );

      res.status(500).json({
        error:
          "Could not generate peer confusion heatmap.",
      });

    }

  }
);


module.exports = router;