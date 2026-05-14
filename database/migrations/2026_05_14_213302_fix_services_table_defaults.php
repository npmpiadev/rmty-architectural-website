<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Fix existing NULL values first
        DB::table('services')
            ->whereNull('image')
            ->update([
                'image' => '',
            ]);

        DB::table('services')
            ->whereNull('content')
            ->update([
                'content' => '',
            ]);

        Schema::table('services', function (Blueprint $table) {

            $table->string('title')->default('')->change();

            $table->longText('content')->default('')->change();

            $table->string('image')->default('')->change();

            $table->boolean('is_published')->default(true)->change();

            $table->unsignedSmallInteger('sort_order')->default(0)->change();
        });
    }

    public function down(): void
    {
        //
    }
};