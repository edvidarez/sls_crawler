import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway";
import { formatJSONResponse } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import AWS from "aws-sdk";

import chromium from "chrome-aws-lambda";
import { addExtra } from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

import schema from "./schema";

const hello: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (
  event
) => {
  let result = null;
  let browser = null;
  let message = "";
  try {
    const puppeteerExtra = addExtra(chromium.puppeteer as any);
    if (event.body.usePlugin) puppeteerExtra.use(StealthPlugin());

    browser = await puppeteerExtra.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    let page = await browser.newPage();

    await page.goto(event.body.url || "https://www.google.com");

    result = await page.title();
    const buffer = await page.screenshot({
      fullPage: true,
      encondig: "base64",
    });
    const s3Bucket = process.env.BUCKET_NAME;
    const s3 = new AWS.S3();
    const s3Params = {
      Bucket: s3Bucket,
      Key: `${Date.now()}.png`,
      Body: buffer,
      ContentEncoding: "base64",
      ContentType: "image/png",
    };
    await s3.upload(s3Params).promise();
    message = `${result}`;
  } catch (error) {
    console.log("error", error);
    message = error.message;
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }

  return formatJSONResponse({
    message,
  });
};

export const main = middyfy(hello);
