import { VercelRequest, VercelResponse } from "@vercel/node";
import { getHitokoto } from "../src/hitokoto";
import * as st2vrc from "send_text_to_vrc";
import { resolve } from "path";
import * as fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import { path as ffmpegPath } from "@ffmpeg-installer/ffmpeg";
import crypto from "crypto";

const r = (...args: string[]) => resolve(__dirname, "..", ...args);
const md5 = (str: string) => crypto.createHash("md5").update(str).digest("hex");

export default async function (req: VercelRequest, res: VercelResponse) {
  if (req.headers.range) return res.status(416).send("Range not supported");
  ffmpeg.setFfmpegPath(ffmpegPath);

  const id = md5(req.headers["x-vercel-id"] as string);
  let outputFile =
    process.env.NODE_ENV === "development"
      ? r(`tmp/${id}.webm`)
      : `/tmp/${id}.webm`;
  const tempDirPrefix =
    process.env.NODE_ENV === "development" ? r("tmp/st2vrc") : "/tmp/st2vrc";

  const params = new URLSearchParams();
  for (const key in req.query) {
    typeof req.query[key] === "string" &&
      params.set(key, req.query[key] as string);
  }
  const hitokoto = await getHitokoto(params);
  const input = new st2vrc.File("hitokoto", ["hitokoto", "from_who", "from"]);
  input.push([hitokoto.hitokoto, hitokoto.from_who, hitokoto.from]);
  await st2vrc.publish([input], outputFile, tempDirPrefix);

  const video = fs.readFileSync(outputFile);
  fs.rmSync(outputFile);

  res.setHeader("content-type", "video/webm");
  res.setHeader("accept-ranges", "none");
  res.send(video);
}
