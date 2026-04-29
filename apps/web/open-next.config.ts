import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  r2_buckets: [
    {
      binding: "NEXT_INC_CACHE_R2_BUCKET",
      bucket_name: "web-opennext-cache",
    },
  ],
});
