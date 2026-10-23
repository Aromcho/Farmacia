CREATE TYPE "public"."banner_placement" AS ENUM('HOME_HERO', 'HOME_PROMO', 'CATALOG');--> statement-breakpoint
CREATE TYPE "public"."delivery_method" AS ENUM('PICKUP', 'DELIVERY');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('FEMENINO', 'MASCULINO', 'UNISEX');--> statement-breakpoint
CREATE TYPE "public"."media_kind" AS ENUM('IMAGE', 'VIDEO');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('NEW', 'CONTACTED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('CASH', 'CARD', 'TRANSFER', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."post_type" AS ENUM('REEL', 'POST');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('ADMIN', 'EDITOR');--> statement-breakpoint
CREATE TYPE "public"."season" AS ENUM('REGULAR', 'SUMMER');--> statement-breakpoint
CREATE TABLE "banners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"placement" "banner_placement" DEFAULT 'HOME_PROMO' NOT NULL,
	"eyebrow" text,
	"title" text NOT NULL,
	"subtitle" text,
	"cta_label" text,
	"cta_href" text,
	"media_id" uuid,
	"mobile_media_id" uuid,
	"active" boolean DEFAULT true NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"origin" text,
	"logo_id" uuid,
	"featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "brands_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"tagline" text,
	"description" text,
	"icon" text,
	"accent" text,
	"cover_id" uuid,
	"parent_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "highlight_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"highlight_id" uuid NOT NULL,
	"media_id" uuid NOT NULL,
	"caption" text,
	"product_id" uuid,
	"link_url" text,
	"duration_ms" integer DEFAULT 5000 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "highlights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"cover_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "highlights_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "inquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"email" text,
	"message" text NOT NULL,
	"product_id" uuid,
	"handled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instagram_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"type" "post_type" DEFAULT 'POST' NOT NULL,
	"caption" text,
	"permalink" text NOT NULL,
	"posted_at" timestamp with time zone,
	"cover_id" uuid,
	"featured" boolean DEFAULT false NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "instagram_posts_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "insurance_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"full_name" text,
	"note" text,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "insurance_providers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "media_kind" DEFAULT 'IMAGE' NOT NULL,
	"path" text NOT NULL,
	"variants" jsonb,
	"width" integer,
	"height" integer,
	"alt" text,
	"blur_data_url" text,
	"dominant_color" text,
	"mime" text,
	"size_bytes" integer,
	"source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opening_hours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"season" "season" DEFAULT 'REGULAR' NOT NULL,
	"weekday" integer NOT NULL,
	"opens" text NOT NULL,
	"closes" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid,
	"name" text NOT NULL,
	"unit_price" integer,
	"quantity" integer DEFAULT 1 NOT NULL,
	"option" text
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"customer_name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"address" text,
	"delivery_method" "delivery_method" DEFAULT 'PICKUP' NOT NULL,
	"payment_method" "payment_method",
	"insurance" text,
	"notes" text,
	"admin_notes" text,
	"status" "order_status" DEFAULT 'NEW' NOT NULL,
	"total" integer,
	"channel" text DEFAULT 'web' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"media_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"brand_id" uuid,
	"category_id" uuid NOT NULL,
	"short_description" text,
	"description" text,
	"presentation" text,
	"gender" "gender",
	"price" integer,
	"cash_price" integer,
	"compare_at_price" integer,
	"show_price" boolean DEFAULT true NOT NULL,
	"notes_top" text[] DEFAULT '{}'::text[] NOT NULL,
	"notes_heart" text[] DEFAULT '{}'::text[] NOT NULL,
	"notes_base" text[] DEFAULT '{}'::text[] NOT NULL,
	"highlights" text[] DEFAULT '{}'::text[] NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"attributes" jsonb,
	"featured" boolean DEFAULT false NOT NULL,
	"is_new" boolean DEFAULT false NOT NULL,
	"has_decant" boolean DEFAULT false NOT NULL,
	"available" boolean DEFAULT true NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"source" text,
	"source_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "special_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"label" text NOT NULL,
	"closed" boolean DEFAULT true NOT NULL,
	"opens" text,
	"closes" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" DEFAULT 'EDITOR' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "banners" ADD CONSTRAINT "banners_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banners" ADD CONSTRAINT "banners_mobile_media_id_media_id_fk" FOREIGN KEY ("mobile_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brands" ADD CONSTRAINT "brands_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "highlight_items" ADD CONSTRAINT "highlight_items_highlight_id_highlights_id_fk" FOREIGN KEY ("highlight_id") REFERENCES "public"."highlights"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "highlight_items" ADD CONSTRAINT "highlight_items_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "highlight_items" ADD CONSTRAINT "highlight_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "highlights" ADD CONSTRAINT "highlights_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_posts" ADD CONSTRAINT "instagram_posts_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "opening_hours_season_weekday_idx" ON "opening_hours" USING btree ("season","weekday");--> statement-breakpoint
CREATE INDEX "orders_status_created_idx" ON "orders" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "product_images_product_media_uq" ON "product_images" USING btree ("product_id","media_id");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "products_brand_idx" ON "products" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "products_active_featured_idx" ON "products" USING btree ("active","featured");