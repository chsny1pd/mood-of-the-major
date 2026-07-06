/* global __ENV */
import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL ?? "http://localhost:3000";
const ACCESS_TOKEN = __ENV.ACCESS_TOKEN ?? "";

export const options = {
  stages: [
    { duration: "20s", target: 10 },
    { duration: "40s", target: 20 },
    { duration: "20s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<200"],
    http_req_failed: ["rate<0.05"],
  },
};

export default function presignLoadTest(): void {
  if (!ACCESS_TOKEN) {
    throw new Error("Set ACCESS_TOKEN to a valid student JWT before running presign load test.");
  }

  const response = http.post(
    `${BASE_URL}/api/v1/images/upload-url`,
    JSON.stringify({
      fileName: "load-test.jpg",
      mimeType: "image/jpeg",
      fileSizeBytes: 102_400,
    }),
    {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    },
  );

  check(response, {
    "status is 200 or 429": (res) => res.status === 200 || res.status === 429,
  });

  sleep(0.5);
}
