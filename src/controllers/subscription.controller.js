import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription
  const channel = await User.findById(channelId);

  if (!channel) {
    throw new ApiError(404, "channel not found");
  }

  if (req.user._id.toString() === channelId.toString()) {
    throw new ApiError(400, "you can not subscribe to yourself");
  }

  const alreadySubscribed = await Subscription.findOneAndDelete({
    subscriber: req.user._id,
    channel: channelId,
  });

  if (alreadySubscribed) {
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "channel unsubscribed successfully"));
  }

  const subscribeChannel = await Subscription.create({
    subscriber: req.user._id,
    channel: channelId,
  });

  if (!subscribeChannel) {
    throw new ApiError(500, "failed to subscribe channel");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribeChannel, "channel subscribed successfully")
    );
});

const getSubscribedStatus = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  const subscribed = await Subscription.exists({
    subscriber: req.user._id,
    channel: channelId,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isSubscribed: subscribed ? true : false },
        "subscription status fetched successfully"
      )
    );
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  const channel = await User.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(channelId) },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $unwind: "$subscribers",
    },
    {
      $lookup: {
        from: "users",
        localField: "subscribers.subscriber",
        foreignField: "_id",
        as: "subscribersDetails",
      },
    },
    {
      $unwind: "$subscribersDetails",
    },
    {
      $project: {
        subscriber: {
          _id: "$subscribersDetails._id",
          username: "$subscribersDetails.username",
          fullName: "$subscribersDetails.fullName",
          avatar: "$subscribersDetails.avatar",
          subscribedAt: "$subscribers.createdAt",
        },
      },
    },
  ]);

 
  const subscribers = channel.map((item) => item.subscriber);
  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribers, "subscribers fetched successfully")
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "invaild subscriber id");
  }

  const subscribedChannel = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channelInfo",
      },
    },
    {
      $unwind: "$channelInfo",
    },
    {
      $project: {
        _id: "$channelInfo._id",
        username: "$channelInfo.username",
        fullName: "$channelInfo.fullName",
        avatar: "$channelInfo.avatar",
        subscribedAt: "$createdAt",
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribedChannel, "channels fetched successfully")
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
