import type { AWS } from "@serverless/typescript";
import hello from "@functions/hello";

const s3Bucket = "images-upload-crawler-test";

const serverlessConfiguration: AWS = {
  service: "bundler-sls",
  frameworkVersion: "3",
  plugins: ["serverless-esbuild"],
  provider: {
    name: "aws",
    runtime: "nodejs14.x",
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      NODE_OPTIONS: "--enable-source-maps --stack-trace-limit=1000",
      BUCKET_NAME: s3Bucket,
    },
    iamRoleStatements: [
      {
        Effect: "Allow",
        Action: ["s3:PutObject", "s3:GetObject"],
        Resource: "arn:aws:s3:::*/*",
      },
      {
        Effect: "Allow",
        Action: ["s3:ListBucket"],
        Resource: "arn:aws:s3:::*",
      },
    ],
  },
  functions: { hello },
  package: { individually: true },
  resources: {
    Resources: {
      S3Bucket: {
        Type: "AWS::S3::Bucket",
        Properties: {
          BucketName: s3Bucket,
        },
      },
    },
  },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: [
        "aws-sdk",
        "chrome-aws-lambda",
        "puppeteer-extra-plugin",
        "puppeteer-core",
        "puppeteer",
      ],
      target: "node14",
      define: { "require.resolve": undefined },
      platform: "node",
      concurrency: 10,
    },
  },
};

module.exports = serverlessConfiguration;
