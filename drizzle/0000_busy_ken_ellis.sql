CREATE TABLE "bookmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"region_id" uuid,
	"location" geometry(Point, 4326),
	"label" varchar(255),
	"score" real,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "demographics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"region_id" uuid NOT NULL,
	"data_year" integer NOT NULL,
	"total_population" integer,
	"population_density" real,
	"age_18_35_pct" real,
	"purchasing_power" real,
	"avg_income" numeric(15, 2),
	"accessibility_score" real,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "export_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"region_id" uuid,
	"format" varchar(20) NOT NULL,
	"parameters" jsonb DEFAULT '{}',
	"file_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "heatmap_cells" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cell_geom" geometry(Polygon, 4326) NOT NULL,
	"center" geometry(Point, 4326) NOT NULL,
	"region_id" uuid,
	"suitability" real,
	"sub_scores" jsonb DEFAULT '{}',
	"zoom_level" integer NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"weight_hash" varchar(64)
);
--> statement-breakpoint
CREATE TABLE "pois" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"brand" varchar(255),
	"location" geometry(Point, 4326) NOT NULL,
	"address" text,
	"region_id" uuid,
	"metadata" jsonb DEFAULT '{}',
	"source" varchar(50) DEFAULT 'manual' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"level" varchar(50) NOT NULL,
	"parent_id" uuid,
	"boundary" geometry(MultiPolygon, 4326),
	"center" geometry(Point, 4326),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suitability_presets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"name" varchar(255) NOT NULL,
	"weight_population" real DEFAULT 0.8 NOT NULL,
	"weight_purchasing_power" real DEFAULT 0.65 NOT NULL,
	"weight_accessibility" real DEFAULT 0.9 NOT NULL,
	"weight_competitor" real DEFAULT -0.4 NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"full_name" varchar(255),
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demographics" ADD CONSTRAINT "demographics_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_logs" ADD CONSTRAINT "export_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_logs" ADD CONSTRAINT "export_logs_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "heatmap_cells" ADD CONSTRAINT "heatmap_cells_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pois" ADD CONSTRAINT "pois_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regions" ADD CONSTRAINT "regions_parent_id_regions_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suitability_presets" ADD CONSTRAINT "suitability_presets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_bookmarks_user" ON "bookmarks" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_demographics_region_year" ON "demographics" USING btree ("region_id","data_year");--> statement-breakpoint
CREATE INDEX "idx_demographics_region" ON "demographics" USING btree ("region_id");--> statement-breakpoint
CREATE INDEX "idx_heatmap_cells_zoom" ON "heatmap_cells" USING btree ("zoom_level");--> statement-breakpoint
CREATE INDEX "idx_pois_type" ON "pois" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_pois_region" ON "pois" USING btree ("region_id");--> statement-breakpoint
CREATE INDEX "idx_regions_parent" ON "regions" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_regions_level" ON "regions" USING btree ("level");