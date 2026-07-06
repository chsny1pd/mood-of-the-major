/* global __ENV */
import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL ?? "http://localhost:3000";

export const options = {
  stages: [
    { duration: "30s", target: 20 },
    { duration: "1m", target: 50 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"],
    http_req_failed: ["rate<0.01"],
  },
};

export default function feedLoadTest(): void {
  const response = http.get(`${BASE_URL}/api/v1/moods/feed?limit=20`);

  check(response, {
    "status is 200": (res) => res.status === 200,
    "success envelope": (res) => {
      const body = res.json() as { success?: boolean };
      return body.success === true;
    },
  });

  sleep(1);
}
