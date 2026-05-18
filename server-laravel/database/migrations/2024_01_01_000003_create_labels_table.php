<?php
// database/migrations/2024_01_01_000003_create_labels_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Tiêu chí 19: Labels CRUD
        Schema::create('labels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 100);
            $table->string('color', 20)->default('#6366f1');
            $table->timestamps();
            $table->unique(['user_id', 'name'], 'unique_label_per_user');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('labels');
    }
};
